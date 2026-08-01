import { DateTime } from 'luxon'
import { isAddress } from 'ethers/lib/utils'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import Image from 'App/Models/Image'
import SetSubmission, {
  DEFAULT_REMAINING_REVEAL_TIME,
  OPT_IN_HOURS,
} from 'App/Models/SetSubmission'
import { isAdmin } from 'App/Middleware/AdminAuth'
import NotAuthenticated from 'App/Exceptions/NotAuthenticated'
import InvalidInput from 'App/Exceptions/InvalidInput'
import DynamicSetImages from 'App/Models/DynamicSetImages'
import TimelineUpdate from 'App/Models/TimelineUpdate'
import ParticipationImage from 'App/Models/ParticipationImage'
import { hasDuplicateImageSelection } from 'App/Helpers/imageSelection'
import Database from '@ioc:Adonis/Lucid/Database'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import {
  reconcileManualCoCreators,
  reconcileSelectedCoCreators,
} from 'App/Helpers/coCreatorAttribution'

const PRINT_IMAGE_COLUMNS = [
  'edition_1ImageId',
  'edition_4ImageId',
  'edition_5ImageId',
  'edition_10ImageId',
  'edition_20ImageId',
  'edition_40ImageId',
] as const

const DYNAMIC_EDITIONS = [1, 4, 5, 10, 20, 40] as const

export default class SetSubmissionsController extends BaseController {
  public async list({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
      search = '',
      status = '',
    } = request.qs()

    const customSort = sort !== '-createdAt'

    const query = SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('creatorAccount')
      .preload('coCreators', (query) => query.preload('account'))

    // Handle status filter
    switch (status) {
      case 'all':
        if (isAdmin(session)) {
          query.withScopes((scopes) => {
            scopes.complete()
          })
          break
        }
      case 'shadowed':
        if (isAdmin(session)) {
          query.withScopes((scopes) => {
            scopes.shadowed()
          })
          if (!customSort) query.orderByRaw('shadowed_at desc NULLS LAST')
        }
        break
      case 'starred':
        query.withScopes((scopes) => {
          scopes.active()
          scopes.starred()
        })
        if (!customSort) query.orderByRaw('starred_at desc NULLS LAST')
        break
      case 'unstarred':
        query.withScopes((scopes) => {
          scopes.live()
          scopes.unstarred()
        })
        if (!customSort) query.orderByRaw('published_at desc')
        break
      case 'deleted':
        if (isAdmin(session)) {
          query.whereNotNull('deletedAt')
          break
        }
      case 'revealed':
        query.whereNotNull('setId')
        query.whereNotNull('revealBlockNumber')
        if (!customSort) query.orderBy('reveals_at', 'desc')
        break
      case 'active':
        query.withScopes((scopes) => scopes.activeTimer())
        break
      case 'paused':
        query.withScopes((scopes) => scopes.pausedTimer())
        break
      case 'prereveal':
        query.withScopes((scopes) => scopes.prereveal())
        break
      case 'public-unrevealed':
        query.whereNull('deletedAt')
        query.whereNull('setId')
        query.withScopes((scopes) => scopes.live())
        break
      case 'demand':
        query.withScopes((scopes) => scopes.live())
        query.where((query) => {
          query
            .where('starredAt', '>=', DateTime.now().minus({ hours: OPT_IN_HOURS }).toISO())
            .orWhereNull('starredAt')
        })
        query.whereJsonPath('submission_stats', '$.demand.total', '>=', 1)
        query.whereNull('setId')
        break
      case 'participation':
        query.withScopes((scopes) => scopes.active())
        query.where('openForParticipation', true)
        query.whereNotNull('name').andWhereNot('name', '')
        query.whereNull('setId')
        break
      default:
        query.withScopes((scopes) => scopes.live())
        query.whereNull('setId')
    }

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)
    await this.applySearch(query, search)

    return query
      .orderBy('createdAt', 'desc') // Default sort to prevent randomisation when paginating
      .paginate(page, limit)
  }

  public async create({ session, request }: HttpContextContract) {
    const creator = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase(),
    })

    const submission = await SetSubmission.firstOrCreate({
      creator: creator.address,
      name: request.input('name', ''),
      deletedAt: null,
    })

    return submission
  }

  public async show({ params }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .preload('set')
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('dynamicSetImages')
      .preload('creatorAccount')
      .preload('coCreators', (query) =>
        query.preload('account', (accountQuery) =>
          accountQuery.preload('pfp').preload('coverImage'),
        ),
      )
      .preload('richContentLinks', (query) => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .preload('participationImages', (query) => {
        query.whereNull('deletedAt')
        query.preload('image')
        query.preload('creator', (creatorQuery) => creatorQuery.preload('pfp'))
        query.orderBy('createdAt', 'desc')
      })
      .firstOrFail()
    // TODO: Implement rich content links
    // .preload('richContentLinks', query => {
    //   query.preload('logo')
    //   query.preload('cover')
    //   query.orderBy('sortIndex')
    // })

    return submission
  }

  public async curated() {
    const baseQuery = (query) =>
      query
        .whereNotNull('starredAt')
        .where('starredAt', '<', DateTime.now().toISO())
        .preload('set')
        .preload('edition1Image')
        .preload('edition4Image')
        .preload('edition5Image')
        .preload('edition10Image')
        .preload('edition20Image')
        .preload('edition40Image')
        .preload('dynamicSetImages')
        .preload('creatorAccount')
        .preload('coCreators', (query) => query.preload('account'))
        .preload('richContentLinks', (query) => {
          query.preload('logo')
          query.preload('cover')
          query.orderBy('sortIndex')
        })

    let currentOrPastSubmission = await baseQuery(SetSubmission.query())
      .where('starredAt', '>=', DateTime.now().minus({ hours: OPT_IN_HOURS }).toISO())
      .orderBy('starredAt')
      .first()

    if (!currentOrPastSubmission) {
      currentOrPastSubmission = await baseQuery(SetSubmission.query())
        .orderBy('starredAt', 'desc')
        .firstOrFail()
    }

    const nextSubmission = await SetSubmission.query()
      .whereNotNull('starredAt')
      .where('starredAt', '>', DateTime.now().toISO())
      .orderBy('starredAt')
      .first()

    return {
      submission: currentOrPastSubmission.toJSON(),
      nextSetAt: nextSubmission?.starredAt,
    }
  }

  public async curationStats({ params }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()

    return submission.curationStats
  }

  public async update(ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (!submission) return ctx.response.badRequest()

    // Don't allow updates on published submissions
    if (submission.publishedAt && !isAdmin(ctx.session)) {
      return ctx.response.unauthorized(`Can't edit published set`)
    }

    const { request, session } = ctx

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    const imageUUIDs = await Promise.all([
      request.input('edition_1_image_id', null),
      request.input('edition_4_image_id', null),
      request.input('edition_5_image_id', null),
      request.input('edition_10_image_id', null),
      request.input('edition_20_image_id', null),
      request.input('edition_40_image_id', null),
    ])
    this.assertUniqueImageSelection(imageUUIDs)

    const images = await Promise.all(imageUUIDs.map((uuid) => Image.findBy('uuid', uuid)))

    // Maintain cache
    if (submission.editionType === 'PRINT') {
      await Image.query()
        .where('setSubmissionId', submission.id)
        .whereNotIn(
          'uuid',
          imageUUIDs.filter((id) => !!id),
        )
        .update({
          setSubmissionId: null,
        })
    }
    const oneOfOneImage = images[0]
    if (oneOfOneImage) {
      oneOfOneImage.setSubmissionId = submission.id
      oneOfOneImage.creator = submission.creator
      await oneOfOneImage.save()
    }
    const editionImages = images.slice(1)
    for (const image of editionImages) {
      if (!image) continue

      if (submission.editionType === 'PRINT') {
        image.setSubmissionId = submission.id
      }
      image.creator = submission.creator
      await image.save()
    }

    const coCreatorAddresses: string[] = (request.input('co_creators') || [])
      .filter((address: string) => isAddress(address))
      .map((address: string) => address.toLowerCase())

    const maxContributionsInput = parseInt(
      request.input('max_contributions_per_contributor', null),
    )
    const maxContributionsPerContributor =
      Number.isNaN(maxContributionsInput) || maxContributionsInput <= 0
        ? null
        : maxContributionsInput

    const updateData: any = {
      name: request.input('name'),
      artist: request.input('artist'),
      description: request.input('description'),
      editionType: request.input('edition_type', 'PRINT'),
      edition_1Name: request.input('edition_1_name'),
      edition_4Name: request.input('edition_4_name'),
      edition_5Name: request.input('edition_5_name'),
      edition_10Name: request.input('edition_10_name'),
      edition_20Name: request.input('edition_20_name'),
      edition_40Name: request.input('edition_40_name'),
      edition_1ImageId: images[0]?.id ?? null,
      edition_4ImageId: images[1]?.id ?? null,
      edition_5ImageId: images[2]?.id ?? null,
      edition_10ImageId: images[3]?.id ?? null,
      edition_20ImageId: images[4]?.id ?? null,
      edition_40ImageId: images[5]?.id ?? null,
      openForParticipation: request.input('open_for_participation', false),
      maxContributionsPerContributor,
    }

    if (isAdmin(ctx.session)) {
      const address = request.input('creator', submission.creator)?.toLowerCase()
      await Account.firstOrCreate({ address }) // Ensure we have this account
      updateData.creator = address
    }

    await submission.merge(updateData).save()

    if (submission.editionType !== 'PRINT' && submission.dynamicSetImages) {
      submission.dynamicSetImages.image_1_1_id = submission.edition_1ImageId
      await submission.dynamicSetImages.save()
      await submission.updateDynamicSetImagesCache()
    }

    await reconcileManualCoCreators(submission, coCreatorAddresses)
    await reconcileSelectedCoCreators(submission)
    await submission.updateSearchString()

    return this.show(ctx)
  }

  public async sign(ctx: HttpContextContract) {
    const { session, request, response } = ctx

    // Fetch our assets
    const submission = await this.show(ctx)
    const user = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase(),
    })

    // Only the creator may sign
    if (user.address !== submission?.creator) return response.unauthorized('Not authorized')

    // Save the signature
    submission.artistSignature = request.input('signature')

    return submission.save()
  }

  public async publish({ params, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .withScopes((scopes) => scopes.complete())
      .preload('creatorAccount')
      .preload('coCreators', (query) => query.preload('account'))
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    submission.publishedAt = DateTime.now()
    await submission.save()

    // Update submission counts for the creator and coCreators
    await submission.creatorAccount.updateSetSubmissionsCount()

    for (const coCreator of submission.coCreators) {
      await coCreator.account.updateSetSubmissionsCount()
    }

    TimelineUpdate.createFor(submission)

    // TODO: Regenerate preview images (!)

    return submission
  }

  public async unpublish({ params, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .whereNull('setId')
      .preload('creatorAccount')
      .preload('coCreators', (query) => query.preload('account'))
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    // Update submission
    submission.publishedAt = null
    submission.revealsAt = null
    submission.remainingRevealTime = DEFAULT_REMAINING_REVEAL_TIME
    await submission.save()

    // Remove set from count for the creator and coCreators
    await submission.creatorAccount.updateSetSubmissionsCount()

    for (const coCreator of submission.coCreators) {
      await coCreator.account.updateSetSubmissionsCount()
    }

    await submission.clearOptIns()

    return submission
  }

  public async shadow(ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (!submission) return ctx.response.badRequest()

    submission.shadowedAt = submission.shadowedAt ? null : DateTime.now()
    await submission.save()

    // Update submission counts for creator and co-creators
    await submission.creatorAccount.updateSetSubmissionsCount()

    for (const coCreator of submission.coCreators) {
      await coCreator.account.updateSetSubmissionsCount()
    }

    return submission
  }

  public async delete(ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (!submission) return ctx.response.badRequest()

    const { session } = ctx
    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    if (submission.revealsAt) throw new InvalidInput(`Can't delete a live set`)

    submission.deletedAt = DateTime.now()
    await submission.save()

    // Remove set from count for the creator and coCreators
    await submission.creatorAccount.updateSetSubmissionsCount()

    for (const coCreator of submission.coCreators) {
      await coCreator.account.updateSetSubmissionsCount()
    }

    return ctx.response.ok('')
  }

  public async forAccount({ params, session, request }: HttpContextContract) {
    const creator = await Account.byId(params.account).firstOrFail()
    await this.creatorOrAdmin({ creator, session })

    const { page = 1, limit = 100, filter = {}, sort = '-createdAt' } = request.qs()

    const query = SetSubmission.query()
      .where('creator', creator.address)
      .withScopes((scopes) => scopes.active())
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async updateImages({ request, params, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .whereNull('setId')
      .preload('creatorAccount')
      .preload('dynamicSetImages')
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    if (submission.publishedAt) {
      throw new InvalidInput(`Can't edit published set`)
    }

    const body = request.body()
    await this.validateUniqueImageSelection(submission, body)
    await this.validateParticipationSelection(submission, body)

    await Database.transaction(async (trx) => {
      submission.useTransaction(trx)
      submission.dynamicSetImages?.useTransaction(trx)

      if (submission.editionType === 'PRINT') {
        await this.updatePrintImages(submission, body, trx)
      } else {
        await this.updateDynamicImages(submission, body, trx)
      }

      await reconcileSelectedCoCreators(submission, trx)
    })

    if (submission.editionType !== 'PRINT') {
      const committedSubmission = await SetSubmission.query()
        .where('id', submission.id)
        .preload('dynamicSetImages')
        .firstOrFail()
      await committedSubmission.updateDynamicSetImagesCache()
    }

    return SetSubmission.query()
      .where('id', submission.id)
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('dynamicSetImages')
      .preload('coCreators', (query) => query.preload('account'))
      .firstOrFail()
  }

  private assertUniqueImageSelection(
    imageIds: (bigint | number | string | null | undefined)[],
  ) {
    if (hasDuplicateImageSelection(imageIds)) {
      throw new InvalidInput('The same image cannot be selected more than once')
    }
  }

  private async validateUniqueImageSelection(submission: SetSubmission, body: any) {
    if (submission.editionType === 'PRINT') {
      const requestedUuids = PRINT_IMAGE_COLUMNS.flatMap((column) => {
        const uuid = body[column]
        return typeof uuid === 'string' && uuid.length > 0 ? [uuid] : []
      })
      const images = requestedUuids.length
        ? await Image.query().whereIn('uuid', [...new Set(requestedUuids)])
        : []
      const uuidToId = new Map(images.map((image) => [image.uuid, image.id]))
      const unknownUuid = requestedUuids.find((uuid) => !uuidToId.has(uuid))

      if (unknownUuid) throw new InvalidInput(`Unknown image UUID: ${unknownUuid}`)

      const finalImageIds = PRINT_IMAGE_COLUMNS.map((column) => {
        if (!Object.prototype.hasOwnProperty.call(body, column)) return submission[column]

        const uuid = body[column]
        if (uuid === null) return null

        return typeof uuid === 'string' && uuid.length > 0 ? uuidToId.get(uuid) : null
      })

      this.assertUniqueImageSelection(finalImageIds)
      return
    }

    if (body.images !== undefined && !Array.isArray(body.images)) {
      throw new InvalidInput('Images must be an array')
    }

    const imageConfigs: { edition: number; index: number; uuid: string | null }[] =
      body.images || []
    const validSlots = new Set(
      DYNAMIC_EDITIONS.flatMap((edition) =>
        Array.from({ length: edition }, (_, index) => `${edition}:${index + 1}`),
      ),
    )

    for (const config of imageConfigs) {
      if (
        !config ||
        !Number.isInteger(config.edition) ||
        !Number.isInteger(config.index) ||
        !validSlots.has(`${config.edition}:${config.index}`) ||
        (config.uuid !== null && (typeof config.uuid !== 'string' || config.uuid.length === 0))
      ) {
        throw new InvalidInput('Invalid dynamic image selection')
      }
    }

    const requestedUuids = imageConfigs.flatMap(({ uuid }) =>
      typeof uuid === 'string' && uuid.length > 0 ? [uuid] : [],
    )
    const images = requestedUuids.length
      ? await Image.query().whereIn('uuid', [...new Set(requestedUuids)])
      : []
    const uuidToId = new Map(images.map((image) => [image.uuid, image.id]))
    const unknownUuid = requestedUuids.find((uuid) => !uuidToId.has(uuid))

    if (unknownUuid) throw new InvalidInput(`Unknown image UUID: ${unknownUuid}`)

    const finalImageIds = new Map<string, bigint | null | undefined>()
    finalImageIds.set('1:1', submission.edition_1ImageId)

    for (const edition of DYNAMIC_EDITIONS.filter((edition) => edition !== 1)) {
      for (let index = 1; index <= edition; index++) {
        finalImageIds.set(
          `${edition}:${index}`,
          submission.dynamicSetImages?.[`image_${edition}_${index}_id`],
        )
      }
    }

    for (const { edition, index, uuid } of imageConfigs) {
      finalImageIds.set(
        `${edition}:${index}`,
        typeof uuid === 'string' && uuid.length > 0 ? uuidToId.get(uuid) : null,
      )
    }

    this.assertUniqueImageSelection([...finalImageIds.values()])
  }

  private async validateParticipationSelection(
    submission: SetSubmission,
    body: any,
  ): Promise<ParticipationImage | null> {
    const participationId = body.participationId
    if (participationId === null || participationId === undefined) return null

    const parsedParticipationId = Number(participationId)
    if (!Number.isSafeInteger(parsedParticipationId) || parsedParticipationId <= 0) {
      throw new InvalidInput('Invalid participation image')
    }

    const imageConfigs: { uuid?: unknown }[] = Array.isArray(body.images) ? body.images : []
    const assignedUuids =
      submission.editionType === 'PRINT'
        ? PRINT_IMAGE_COLUMNS.map((column) => body[column]).filter(
            (uuid): uuid is string => typeof uuid === 'string' && uuid.length > 0,
          )
        : imageConfigs
            .map((config) => config.uuid)
            .filter((uuid): uuid is string => typeof uuid === 'string' && uuid.length > 0)

    const images = assignedUuids.length
      ? await Image.query().whereIn('uuid', assignedUuids)
      : []
    const knownUuids = new Set(images.map((image) => image.uuid))
    const unknownUuid = assignedUuids.find((uuid) => !knownUuids.has(uuid))
    if (unknownUuid) throw new InvalidInput(`Unknown image UUID: ${unknownUuid}`)

    const participationImage = await ParticipationImage.query()
      .where('id', parsedParticipationId)
      .where('setSubmissionId', submission.id)
      .whereNull('deletedAt')
      .preload('image')
      .first()

    if (!participationImage?.image || !knownUuids.has(participationImage.image.uuid)) {
      throw new InvalidInput('Participation image does not match an assigned image')
    }

    return participationImage
  }

  private async updatePrintImages(
    submission: SetSubmission,
    body: any,
    client?: TransactionClientContract,
  ) {
    const changedColumns = PRINT_IMAGE_COLUMNS.filter((column) =>
      Object.prototype.hasOwnProperty.call(body, column),
    )
    const uuids = changedColumns.flatMap((column) =>
      typeof body[column] === 'string' && body[column].length > 0 ? [body[column]] : [],
    )
    const images = uuids.length
      ? await Image.query(client ? { client } : undefined).whereIn('uuid', uuids)
      : []
    const uuidToId = new Map(images.map((img) => [img.uuid, img.id]))

    const updateData = Object.fromEntries(
      changedColumns.map((col) => {
        const uuid = body[col]
        if (uuid === null) return [col, null]
        const id = uuidToId.get(uuid)
        if (!id) throw new InvalidInput(`Unknown image UUID: ${uuid}`)
        return [col, id]
      }),
    )

    await submission.merge(updateData).save()

    if (submission.editionType === 'PRINT') {
      const selectedIds = PRINT_IMAGE_COLUMNS.map((column) => submission[column]).filter(
        Boolean,
      )
      const staleImages = Image.query(client ? { client } : undefined).where(
        'setSubmissionId',
        submission.id,
      )

      if (selectedIds.length) (staleImages as any).whereNotIn('id', selectedIds)
      await staleImages.update({ setSubmissionId: null })

      await (Image.query(client ? { client } : undefined) as any)
        .whereIn('id', selectedIds)
        .update({ setSubmissionId: submission.id })
    }
  }

  private async updateDynamicImages(
    submission: SetSubmission,
    body: any,
    client?: TransactionClientContract,
  ) {
    const imageConfigs: { edition: number; index: number; uuid: string | null }[] =
      body.images || []

    if (!submission.dynamicSetImages) {
      const dynamicSetImages = await DynamicSetImages.create(
        {},
        client ? { client } : undefined,
      )
      submission.dynamicSetImagesId = dynamicSetImages.id
      submission.$setRelated('dynamicSetImages', dynamicSetImages)
      await submission.save()
    }

    const validUuids = imageConfigs
      .filter((c) => c.uuid !== null && c.uuid !== undefined)
      .map((c) => c.uuid as string)

    const images =
      validUuids.length > 0
        ? await Image.query(client ? { client } : undefined).whereIn('uuid', validUuids)
        : []
    const uuidToId = new Map(images.map((img) => [img.uuid, img.id]))

    for (const { edition, index, uuid } of imageConfigs) {
      // handle deletion case (when uuid is null)
      if (uuid === null || uuid === undefined) {
        submission.dynamicSetImages[`image_${edition}_${index}_id`] = null
        if (edition === 1) submission.edition_1ImageId = null as any
        continue
      }

      const imageId = uuidToId.get(uuid)!

      // special case for 1/1s
      if (edition === 1) {
        submission.edition_1ImageId = imageId

        const img = images.find((img) => img.uuid === uuid)!
        if (client) img.useTransaction(client)
        img.setSubmissionId = submission.id
        await img.save()
      }

      submission.dynamicSetImages[`image_${edition}_${index}_id`] = imageId
    }

    await submission.save()
    await submission.dynamicSetImages.save()
  }

  protected async creatorOrAdmin({ creator, session }) {
    const currentUserAddress = session.get('siwe')?.address?.toLowerCase()

    if (!currentUserAddress) throw new NotAuthenticated()

    const user = await Account.firstOrCreate({
      address: currentUserAddress,
    })

    // Make sure we're admin or creator
    if (user.address !== creator.address && !isAdmin(session)) {
      throw new NotAuthenticated(`Not authorized`)
    }

    return { user }
  }
}
