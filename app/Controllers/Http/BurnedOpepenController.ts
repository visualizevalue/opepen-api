import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import EventModel from 'App/Models/Event'

export default class BurnedOpepenController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      sort = ''
    } = request.qs()

    const query = EventModel.query()
      .where('contract', 'BURNED_OPEPEN')
      .where('type', 'Burn')
      .preload('fromAccount')
      .preload('opepen', q => {
        q.preload('image')
        q.preload('burnedOpepen', q => q.preload('image'))
      })

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      .orderByRaw('block_number::int desc')
      .orderByRaw('log_index::int desc')
      .paginate(page, limit)
  }

}
