import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import NotAuthorized from 'App/Exceptions/NotAuthorized'
import { isAdmin } from 'App/Middleware/AdminAuth'
import FarcasterData from 'App/Services/FarcasterData'
import BaseController from './BaseController'

export default class CastsController extends BaseController {

  public async show ({ params }: HttpContextContract) {
    return FarcasterData.getOrImportCast(params.fid, params.hash)
  }

  public async approve (ctx: HttpContextContract) {
    const cast = await this.show(ctx)

    cast.approvedAt = DateTime.now()
    await cast.save()

    return cast
  }

  public async destroy (ctx: HttpContextContract) {
    const post = await this.show(ctx)

    const currentAddress = ctx.session.get('siwe')?.address?.toLowerCase()
    if (post.address !== currentAddress && ! isAdmin(ctx.session)) {
      throw new NotAuthorized(`Only the owner can delete a post`)
    }

    post.deletedAt = DateTime.now()
    await post.save()

    return post
  }

}
