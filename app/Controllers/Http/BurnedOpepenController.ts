import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BurnedOpepenRenderer from 'App/Frames/BurnedOpepenRenderer'
import Account from 'App/Models/Account'
import BurnedOpepen from 'App/Models/BurnedOpepen'
import BaseController from './BaseController'

export default class BurnedOpepenController extends BaseController {
  public async list({ request }: HttpContextContract) {
    const { page = 1, limit = 24, filter = {}, sort = '' } = request.qs()

    const query = BurnedOpepen.query()
      .preload('opepen')
      .preload('ownerAccount')
      .preload('burnerAccount')
      .preload('image')

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async forAccount({ params, request }: HttpContextContract) {
    const { page = 1, limit = 16_000, filter = {}, sort = '' } = request.qs()

    const account = await Account.byId(params.id).firstOrFail()

    const query = BurnedOpepen.query()
      .where('owner', account.address)
      .preload('image')
      .preload('opepen', (q) => {
        q.preload('image')
      })

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.orderBy(`tokenId`).paginate(page, limit)
  }

  public async show({ params }: HttpContextContract) {
    const opepen = await BurnedOpepen.query()
      .where('tokenId', params.id)
      .preload('opepen')
      .preload('ownerAccount')
      .preload('burnerAccount')
      .preload('lastEvent')
      .preload('image')
      .firstOrFail()

    return { ...opepen.toJSON() }
  }

  public async og({ request, params, response }: HttpContextContract) {
    const opepen = await BurnedOpepen.query()
      .where('tokenId', params.id)
      .preload('opepen')
      .preload('ownerAccount')
      .preload('burnerAccount')
      .preload('events')
      .preload('image')
      .firstOrFail()

    const image = await BurnedOpepenRenderer.render(opepen, request.method() === 'POST')

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }
}
