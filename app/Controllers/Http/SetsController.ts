import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Set from 'App/Models/Set'
import BaseController from './BaseController'

export default class SetsController extends BaseController {
  public async show ({ params }: HttpContextContract) {
    return Set.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .where('id', params.id)
      .firstOrFail()
  }
}
