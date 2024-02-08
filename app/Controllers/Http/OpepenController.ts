import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import { DateTime } from 'luxon'
import DailyOpepen from 'App/Services/DailyOpepen'

export default class OpepenController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      sort = ''
    } = request.qs()

    const query = Opepen.query().preload('image')

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    query.orderBy('tokenId', 'asc')

    return query.paginate(page, limit)
  }

  public async show ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('tokenId', params.id)
      .preload('set')
      .preload('ownerAccount')
      .preload('image')
      .firstOrFail()
  }

  public async updateImage (context: HttpContextContract) {
    const opepen = await this.show(context)

    await opepen.updateImage()

    return opepen
  }

  public async forAccount ({ params, request }: HttpContextContract) {
    const {
      page = 1,
      limit = 16_000,
      filter = {},
      sort = ''
    } = request.qs()

    const query = Opepen.query()
      .where('owner', params.id.toLowerCase())
      .preload('image')

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    return query
      .orderBy('setId')
      .orderByRaw(`(data->>'edition')::int`)
      .paginate(page, limit)
  }

  public async summary ({ params, response, }: HttpContextContract) {
    const image = await DailyOpepen.forDay(DateTime.fromISO(params.date))

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

}
