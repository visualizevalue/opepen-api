import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'

export default class OpepenController extends BaseController {

  public async forAccount ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('owner', params.id.toLowerCase())
      .orderBy('tokenId')
      .paginate(1, 16_000)
  }

}
