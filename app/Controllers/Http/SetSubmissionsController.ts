import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import Image from 'App/Models/Image'
import { isAdmin } from 'App/Middleware/AdminAuth'
import { DateTime } from 'luxon'

export default class SetSubmissionsController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '',
      status = 'complete',
    } = request.qs()

    const query = SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')

    // Handle status filter
    switch (status) {
      case 'all':
        query.withScopes(scopes => scopes.active())
        break;
      case 'complete':
        query.withScopes(scopes => {
          scopes.complete()
          scopes.active()
          scopes.unpublished()
          scopes.unstarred()
        })
        break;
      case 'starred':
        query.withScopes(scopes => {
          scopes.active()
          scopes.unpublished()
          scopes.starred()
        })
        break;
      case 'published':
        query.withScopes(scopes => {
          scopes.active()
          scopes.published()
        })
        break;
      case 'deleted':
        query.whereNotNull('deletedAt')
        break;
      default:
        query.withScopes(scopes => scopes.active())
        break;
    }

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    return query
      .orderByRaw('starred_at desc NULLS LAST')
      .orderBy('createdAt', 'desc')
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

  public async show ({
    session,
    params,
    response
  }: HttpContextContract) {
    const user = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase()
    })

    const submission = await SetSubmission.query()
      .where('uuid', params.id)
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .firstOrFail()

    if (user.address !== submission.creator && !isAdmin(session)) {
      return response.unauthorized('Not authorized')
    }

    return submission
  }

  public async update (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    const { request } = ctx

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

    return submission
      .merge({
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
      .save()
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

  public async star (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    submission.starredAt = submission.starredAt ? null : DateTime.now()

    return submission.save()
  }

  public async publish (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    const { request } = ctx
    const setId: number = request.input('set_id')
    const hours: number = request.input('hours', 72)

    if (! setId) ctx.response.badRequest('No set provided')

    await submission.publish(setId, hours)

    return submission.save()
  }

  public async delete (ctx: HttpContextContract) {
    const submission = await this.show(ctx)
    if (! submission) return ctx.response.badRequest()

    submission.deletedAt = DateTime.now()
    await submission.save()

    return ctx.response.ok('')
  }

  public async forAccount ({ params, session, request, response }: HttpContextContract) {
    const creator = await Account.byId(params.account).firstOrFail()
    const user = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase()
    })

    // Make sure we're admin or creator
    if (user.address !== creator.address && !isAdmin(session)) {
      return response.unauthorized('Not authorized')
    }


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

}
