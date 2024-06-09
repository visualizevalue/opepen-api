import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import NotAuthorized from 'App/Exceptions/NotAuthorized'
import { isAdmin } from 'App/Middleware/AdminAuth'
import FarcasterData from 'App/Services/FarcasterData'
import BaseController from './BaseController'
import Cast from 'App/Models/Cast'

export default class CastsController extends BaseController {

  public async show ({ params }: HttpContextContract) {
    return FarcasterData.getOrImportCast(params.fid, params.hash)
  }

  public async approve ({ params }: HttpContextContract) {
    const cast = await this.get(params.id)

    cast.approvedAt = DateTime.now()
    await cast.save()

    return cast
  }

  public async destroy ({ params, session }: HttpContextContract) {
    const post = await this.get(params.id)

    const currentAddress = session.get('siwe')?.address?.toLowerCase()
    if (post.address !== currentAddress && ! isAdmin(session)) {
      throw new NotAuthorized(`Only the owner can delete a post`)
    }

    post.deletedAt = DateTime.now()
    await post.save()

    return post
  }

  protected async get (id) {
    return Cast.query()
      .where('hash', id)
      .preload('account')
      .firstOrFail()
  }

}
