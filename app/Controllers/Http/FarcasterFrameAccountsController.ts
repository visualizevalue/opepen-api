import axios from 'axios'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Account from 'App/Models/Account'
import FarcasterFramesController, { type Action } from './FarcasterFramesController'
import AccountRenderer from 'App/Frames/AccountRenderer'
import Opepen from 'App/Models/Opepen'

export default class FarcasterFrameAccountsController extends FarcasterFramesController {
  public async account({ request, params }: HttpContextContract) {
    if (request.method() === 'GET') return this.accountOverview(params.id)

    const qs = request.qs()
    const index = parseInt(qs.index || -1)

    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    let nextIndex = buttonIndex === 1 ? index - 1 : index + 1

    if (nextIndex === -1) return this.accountOverview(params.id)

    return this.accountOpepenResponse(params.id, nextIndex)
  }

  private async accountOverview(id: string) {
    const account = await Account.byId(id).firstOrFail()
    const opepen = await Opepen.query().where('owner', account.address)

    const actions: Action[] = [
      {
        text: `View on on Opepen.art`,
        action: 'link',
        target: `https://opepen.art/holders/${id}`,
      },
    ]

    if (opepen?.length) {
      actions.push('Browse Opepen →')
    }

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/render/accounts/${id}/image`,
      postUrl: `${Env.get('APP_URL')}/v1/render/accounts/${id}`,
      actions,
    })
  }

  private async accountOpepenResponse(accountId: string, opepenIndex: number) {
    const account = await Account.byId(accountId).firstOrFail()
    const opepens = await Opepen.query()
      .where('owner', account.address)
      .preload('image')
      .orderBy('setId')
      .orderByRaw(`(data->>'edition')::int`)

    // Cycle back to overview
    if (opepenIndex < 0 || opepenIndex >= opepens?.length) {
      return this.accountOverview(accountId)
    }

    const isFirst = opepenIndex === 0
    const isLast = opepenIndex + 1 >= opepens?.length

    const actions: Action[] = [
      isFirst ? '↺ Overview' : '← Previous',
      isLast ? '↺ Overview' : 'Next →',
    ]

    const opepen = opepens[opepenIndex]
    let imageUrl = opepen.image?.staticURI

    if (!imageUrl) {
      const GET_URI = `https://metadata.opepen.art/${opepen.tokenId}/image-uri`
      const {
        data: { uri },
      } = await axios.get(GET_URI)

      imageUrl = uri
    }

    return this.response({
      imageUrl,
      postUrl: `${Env.get('APP_URL')}/v1/render/accounts/${accountId}?index=${opepenIndex}`,
      imageRatio: '1:1',
      actions,
    })
  }

  /**
   * The main image for a profile
   */
  public async image({ params, response }: HttpContextContract) {
    const account = await Account.byId(params.id)
      .preload('pfp')
      .preload('coverImage')
      .firstOrFail()
    const opepen = await Opepen.query().where('owner', account.address).preload('image')

    const image =
      opepen?.length >= 2
        ? await AccountRenderer.renderWithOwnedOpepen(account)
        : await AccountRenderer.render(account)

    return this.imageResponse(image, response)
  }
}
