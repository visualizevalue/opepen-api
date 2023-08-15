import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'

export default class OpepenController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      sort = ''
    } = request.qs()

    const query = Opepen.query()

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    query.orderBy('tokenId', 'asc')

    return query.paginate(page, limit)
  }

  public async show ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('tokenId', params.id)
      .preload('set')
      .preload('image')
      .preload('events')
      .firstOrFail()
  }

  public async forAccount ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('owner', params.id.toLowerCase())
      .preload('image')
      .orderBy('setId')
      .orderByRaw(`(data->>'edition')::int`)
      .paginate(1, 16_000)
  }

}
