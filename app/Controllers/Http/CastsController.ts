import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Cast from 'App/Models/Cast'

export default class CastsController extends BaseController {

  public async show ({ params }: HttpContextContract) {
    return Cast.query()
      .where('hash', params.id)
      .preload('account')
      .firstOrFail()
  }

  public async approve (ctx: HttpContextContract) {
    const cast = await this.show(ctx)

    cast.approvedAt = DateTime.now()
    await cast.save()

    return cast
  }

}
