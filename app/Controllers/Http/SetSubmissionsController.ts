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

    await submission.related('coCreators').query().delete()

    for (const address of coCreatorAddresses) {
      const account = await Account.firstOrCreate({ address })
      await submission.related('coCreators').create({ accountId: account.id })
    }

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
      edition_1ImageId: images[0]?.id,
      edition_4ImageId: images[1]?.id,
      edition_5ImageId: images[2]?.id,
      edition_10ImageId: images[3]?.id,
      edition_20ImageId: images[4]?.id,
      edition_40ImageId: images[5]?.id,
      openForParticipation: request.input('open_for_participation', false),
    }

    if (isAdmin(ctx.session)) {
      const address = request.input('creator', submission.creator)?.toLowerCase()
      await Account.firstOrCreate({ address }) // Ensure we have this account
      updateData.creator = address
    }

    await submission.merge(updateData).save()
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

    const body = request.body()

    if (submission.editionType === 'PRINT') {
      await this.updatePrintImages(submission, body)
    } else {
      await this.updateDynamicImages(submission, body)
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
      .firstOrFail()
  }

  private async updatePrintImages(submission: SetSubmission, body: any) {
    const columns = [
      'edition_1ImageId',
      'edition_4ImageId',
      'edition_5ImageId',
      'edition_10ImageId',
      'edition_20ImageId',
      'edition_40ImageId',
    ] as const

    const uuids = columns.filter((col) => body[col]).map((col) => body[col])
    const images = await Image.query().whereIn('uuid', uuids)
    const uuidToId = new Map(images.map((img) => [img.uuid, img.id]))

    const updateData = Object.fromEntries(
      columns.flatMap((col) => {
        const uuid = body[col]
        if (!uuid) return []
        const id = uuidToId.get(uuid)
        if (!id) throw new InvalidInput(`Unknown image UUID: ${uuid}`)
        return [[col, id]]
      }),
    )

    await submission.merge(updateData).save()

    if (submission.editionType === 'PRINT') {
      await Image.query()
        .where('setSubmissionId', submission.id)
        .whereNotIn('uuid', uuids)
        .update({ setSubmissionId: null })

      await Promise.all(
        images.map(async (image) => {
          image.setSubmissionId = submission.id
          await image.save()
        }),
      )
    }
  }

  private async updateDynamicImages(submission: SetSubmission, body: any) {
    const imageConfigs: { edition: number; index: number; uuid: string | null }[] =
      body.images || []

    if (!submission.dynamicSetImages) {
      const dynamicSetImages = await DynamicSetImages.create({})
      submission.dynamicSetImagesId = dynamicSetImages.id
      await submission.save()
      await submission.load('dynamicSetImages')
    }

    const validUuids = imageConfigs
      .filter((c) => c.uuid !== null && c.uuid !== undefined)
      .map((c) => c.uuid as string)

    const images = validUuids.length > 0 ? await Image.query().whereIn('uuid', validUuids) : []
    const uuidToId = new Map(images.map((img) => [img.uuid, img.id]))

    for (const { edition, index, uuid } of imageConfigs) {
      // handle deletion case (when uuid is null)
      if (uuid === null || uuid === undefined) {
        submission.dynamicSetImages[`image_${edition}_${index}_id`] = null
        continue
      }

      const imageId = uuidToId.get(uuid)!

      // special case for 1/1s
      if (edition === 1) {
        submission.edition_1ImageId = imageId

        const img = images.find((img) => img.uuid === uuid)!
        img.setSubmissionId = submission.id
        await img.save()
      }

      submission.dynamicSetImages[`image_${edition}_${index}_id`] = imageId
    }

    await submission.save()
    await submission.dynamicSetImages.save()
    await submission.updateDynamicSetImagesCache()
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
