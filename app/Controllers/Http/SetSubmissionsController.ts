import { DateTime } from 'luxon'
import { isAddress } from 'ethers/lib/utils'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BotNotifications from 'App/Services/BotNotifications'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import Image from 'App/Models/Image'
import SetSubmission, { DEFAULT_REMAINING_REVEAL_TIME } from 'App/Models/SetSubmission'
import { isAdmin } from 'App/Middleware/AdminAuth'
import NotAuthenticated from 'App/Exceptions/NotAuthenticated'
import InvalidInput from 'App/Exceptions/InvalidInput'
import DynamicSetImages from 'App/Models/DynamicSetImages'
import TimelineUpdate from 'App/Models/TimelineUpdate'

export default class SetSubmissionsController extends BaseController {

  public async list ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
      status = '',
    } = request.qs()

    const query = SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('creatorAccount')
      .preload('coCreator1Account')
      .preload('coCreator2Account')
      .preload('coCreator3Account')
      .preload('coCreator4Account')
      .preload('coCreator5Account')

    // Handle status filter
    switch (status) {
      case 'unapproved':
        if (isAdmin(session)) {
          query.withScopes(scopes => {
            query.whereNull('deletedAt')
            scopes.published()
            scopes.unapproved()
            scopes.unstarred()
          })
          break
        }
      case 'all':
        if (isAdmin(session)) {
          query.withScopes(scopes => {
            scopes.complete()
          })
          break
        }
      case 'starred':
        query.withScopes(scopes => {
          scopes.active()
          scopes.starred()
        })
        query.orderByRaw('starred_at desc NULLS LAST')
        break
      case 'curated':
        query.withScopes(scopes => {
          scopes.active()
          scopes.starred()
          scopes.noTimer()
        })
        query.orderByRaw('starred_at desc NULLS LAST')
        break
      case 'unstarred':
        query.withScopes(scopes => {
          scopes.live()
          scopes.unstarred()
        })
        query.orderByRaw('approved_at desc')
        break
      case 'deleted':
        if (isAdmin(session)) {
          query.whereNotNull('deletedAt')
          break
        }
      case 'revealed':
        query.whereNotNull('setId')
        query.whereNotNull('revealBlockNumber')
        query.orderBy('reveals_at', 'desc')
        break
      case 'active':
        query.withScopes(scopes => scopes.activeTimer())
        break
      case 'paused':
        query.withScopes(scopes => scopes.pausedTimer())
        break
      case 'prereveal':
        query.withScopes(scopes => scopes.prereveal())
        break
      case 'public-unrevealed':
        query.whereNull('deletedAt')
        query.whereNull('setId')
        query.withScopes(scopes => {
          scopes.published()
          scopes.approved()
        })
        break
      case 'demand':
        query.withScopes(scopes => scopes.live())
        query.whereJsonPath('submission_stats', '$.holders.total', '>=', 3)
        query.whereNull('setId')
        break
      default:
        query.withScopes(scopes => scopes.live())
        query.whereNull('setId')
    }

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      .orderBy('createdAt', 'desc') // Default sort to prevent randomisation when paginating
      .paginate(page, limit)
  }

  public async create ({ session, request }: HttpContextContract) {
    const creator = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase()
    })

    const [
      image1,
      image4,
      image5,
      image10,
      image20,
      image40,
    ] = await Promise.all([
      Image.findBy('uuid', request.input('edition_1_image_id', null)),
      Image.findBy('uuid', request.input('edition_4_image_id', null)),
      Image.findBy('uuid', request.input('edition_5_image_id', null)),
      Image.findBy('uuid', request.input('edition_10_image_id', null)),
      Image.findBy('uuid', request.input('edition_20_image_id', null)),
      Image.findBy('uuid', request.input('edition_40_image_id', null)),
    ])

    return SetSubmission.create({
      creator: creator.address,
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
      edition_1ImageId: image1?.id,
      edition_4ImageId: image4?.id,
      edition_5ImageId: image5?.id,
      edition_10ImageId: image10?.id,
      edition_20ImageId: image20?.id,
      edition_40ImageId: image40?.id,
    })
  }

  public async show ({ params }: HttpContextContract) {
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
      .preload('coCreator1Account')
      .preload('coCreator2Account')
      .preload('coCreator3Account')
      .preload('coCreator4Account')
      .preload('coCreator5Account')
      .firstOrFail()
      // TODO: Implement rich content links
      // .preload('richContentLinks', query => {
      //   query.preload('logo')
      //   query.preload('cover')
      //   query.orderBy('sortIndex')
      // })

    return submission
  }

  public async curated () {
      const baseQuery = query => query
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
        .preload('coCreator1Account')
        .preload('coCreator2Account')
        .preload('coCreator3Account')
        .preload('coCreator4Account')
        .preload('coCreator5Account')

    let currentOrPastSubmission = await baseQuery(SetSubmission.query())
      .where('starredAt', '>=',  DateTime.now().minus({ hours: 48 }).toISO())
      .orderBy('starredAt')
      .first()

    if (! currentOrPastSubmission) {
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

  public async curationStats ({ params }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()

    return submission.curationStats
  }

  public async update (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    // Don't allow updates on published submissions
    if (submission.publishedAt && !isAdmin(ctx.session)) {
      return ctx.response.unauthorized(`Can't edit published set`)
    }

    const { request, session } = ctx

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    const [
      image1,
      image4,
      image5,
      image10,
      image20,
      image40,
    ] = await Promise.all([
      Image.findBy('uuid', request.input('edition_1_image_id', null)),
      Image.findBy('uuid', request.input('edition_4_image_id', null)),
      Image.findBy('uuid', request.input('edition_5_image_id', null)),
      Image.findBy('uuid', request.input('edition_10_image_id', null)),
      Image.findBy('uuid', request.input('edition_20_image_id', null)),
      Image.findBy('uuid', request.input('edition_40_image_id', null)),
    ])

    const [
      co_creator_1,
      co_creator_2,
      co_creator_3,
      co_creator_4,
      co_creator_5,
    ] = await Promise.all(
      [
        request.input('co_creator_1', null),
        request.input('co_creator_2', null),
        request.input('co_creator_3', null),
        request.input('co_creator_4', null),
        request.input('co_creator_5', null),
      ]
      .filter(address => isAddress(address))
      .map(address => address.toLowerCase())
      .map(address => Account.firstOrCreate({ address }))
    )

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
      edition_1ImageId: image1?.id,
      edition_4ImageId: image4?.id,
      edition_5ImageId: image5?.id,
      edition_10ImageId: image10?.id,
      edition_20ImageId: image20?.id,
      edition_40ImageId: image40?.id,
      co_creator_1: co_creator_1?.address,
      co_creator_2: co_creator_2?.address,
      co_creator_3: co_creator_3?.address,
      co_creator_4: co_creator_4?.address,
      co_creator_5: co_creator_5?.address,
    }

    if (isAdmin(ctx.session)) {
      updateData.creator = request.input('creator', submission.creator)?.toLowerCase()
    }

    await submission.merge(updateData).save()

    return this.show(ctx)
  }

  public async updateDynamicSetImages ({ params, request, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .preload('creatorAccount')
      .preload('dynamicSetImages')
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    const imageConfig: { edition: number, index: number, uuid: string }[] = request.input('images')


    if (! submission.dynamicSetImages) {
      const setImages = await DynamicSetImages.create({})
      submission.dynamicSetImagesId = setImages.id
      await submission.save()
      await submission.load('dynamicSetImages')
    }

    for (const config of imageConfig) {
      if (! config.uuid) continue

      const image = await Image.query().where('uuid', config.uuid).firstOrFail()

      submission.dynamicSetImages[`image_${config.edition}_${config.index}_id`] = image.id
    }

    await submission.dynamicSetImages.save()

    return submission.load('dynamicSetImages')
  }

  public async sign (ctx: HttpContextContract) {
    const { session, request, response } = ctx

    // Fetch our assets
    const submission = await this.show(ctx)
    const user = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase()
    })

    // Only the creator may sign
    if (user.address !== submission?.creator) return response.unauthorized('Not authorized')

    // Save the signature
    submission.artistSignature = request.input('signature')

    return submission.save()
  }

  public async publish ({ params, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .withScopes(scopes => scopes.complete())
      .preload('creatorAccount')
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    submission.publishedAt = DateTime.now()

    return submission.save()
  }

  public async unpublish ({ params, session }: HttpContextContract) {
    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .whereNull('setId')
      .preload('creatorAccount')
      .firstOrFail()

    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    // Remove set from count
    await submission.creatorAccount.updateSetSubmissionsCount()

    // Update submission
    submission.publishedAt = null
    submission.approvedAt = null
    submission.revealsAt = null
    submission.remainingRevealTime = DEFAULT_REMAINING_REVEAL_TIME

    await submission.clearOptIns()

    return submission.save()
  }

  public async approve (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission || submission.approvedAt) return ctx.response.badRequest()

    await this._approve(submission)

    return submission
  }

  public async unapprove (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    submission.approvedAt = null

    await submission.save()

    return submission
  }

  public async star (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    submission.starredAt = submission.starredAt ? null : DateTime.now()
    await this._approve(submission)

    if (submission.starredAt) {
      await submission.notify('NewCuratedSubmission')
      BotNotifications?.newCuratedSubmission(submission)
    }

    return submission
  }

  public async delete (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    const { session } = ctx
    await this.creatorOrAdmin({ creator: submission.creatorAccount, session })

    if (submission.revealsAt) throw new InvalidInput(`Can't delete a live set`)

    submission.deletedAt = DateTime.now()
    await submission.save()

    return ctx.response.ok('')
  }

  public async forAccount ({ params, session, request }: HttpContextContract) {
    const creator = await Account.byId(params.account).firstOrFail()
    await this.creatorOrAdmin({ creator, session })

    const { page = 1, limit = 100 } = request.qs()
    return SetSubmission.query()
      .where('creator', creator.address)
      .withScopes((scopes) => scopes.active())
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .paginate(page, limit)
  }

  protected async _approve (submission: SetSubmission) {
    const wasApproved = !!submission.approvedAt

    // Approve and publish
    submission.approvedAt = DateTime.now()
    submission.publishedAt = submission.publishedAt ?? submission.approvedAt
    await submission.save()

    // Add submission to creator count
    if (! wasApproved) {
      submission.creatorAccount.setSubmissionsCount += 1
      await submission.creatorAccount.save()

      await TimelineUpdate.createFor(submission)
    }

    return submission
  }

  protected async creatorOrAdmin({ creator, session }) {
    const currentUserAddress = session.get('siwe')?.address?.toLowerCase()

    if (! currentUserAddress) throw new NotAuthenticated()

    const user = await Account.firstOrCreate({
      address: currentUserAddress
    })

    // Make sure we're admin or creator
    if (user.address !== creator.address && !isAdmin(session)) {
      throw new NotAuthenticated(`Not authorized`)
    }

    return { user }
  }

}
