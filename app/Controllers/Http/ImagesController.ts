import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Image from 'App/Models/Image'
import BaseController from './BaseController'

export default class ImagesController extends BaseController {
  public async show ({ params }: HttpContextContract) {
    return Image.query()
      .preload('aiImage', query => {
        query.whereNotNull('journeyStepId')
        query.preload('journeyStep', query => query.preload('journey'))
      })
      .where('uuid', params.id)
      .firstOrFail()
  }

  public async featured ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
    } = request.qs()

    const query = Image.query()
      .whereNotNull('featuredAt')
      .orderBy('featuredAt', 'desc')

    return query.paginate(page, limit)
  }
}
