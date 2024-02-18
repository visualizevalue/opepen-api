import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import FarcasterFramesController from './FarcasterFramesController'
import AccountRenderer from 'App/Frames/AccountRenderer'

export default class FarcasterFrameAccountsController extends FarcasterFramesController {

  /**
   * The main image for a profile
   */
  public async image ({ params, response }: HttpContextContract) {
    const account = await Account.byId(params.id)
      .preload('pfp')
      .preload('coverImage')
      .firstOrFail()

    return this.imageResponse(
      await AccountRenderer.render(account),
      response
    )
  }

}
