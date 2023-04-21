import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import RevealService from 'App/Services/Reveals/Reveals'

export default class RevealsController extends BaseController {

  public async forAccount({ params }: HttpContextContract) {
    try {
      const { winners } = await RevealService.getReveals(params.reveal)

      return winners[params.account.toLowerCase()]
    } catch (e) {
      return null
    }
  }

}
