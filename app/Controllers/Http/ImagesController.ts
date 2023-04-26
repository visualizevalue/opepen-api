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
}
