import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/SetModel'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import OpepenService from 'App/Services/OpepenService'
import Account from 'App/Models/Account'
import Database from '@ioc:Adonis/Lucid/Database'

export default class SetsController extends BaseController {
  public async list() {
    return OpepenService.listSets()
  }

  public async show({ params }: HttpContextContract) {
    const set = await SetModel.query()
      .preload('submission')
      .preload('replacedSubmission')
      .where('id', params.id)
      .firstOrFail()

    return set
  }

  public async stats({ params }: HttpContextContract) {
    return {
      floorListing: await Opepen.query()
        .whereNotNull('price')
        .where('setId', params.id)
        .orderBy('price')
        .first(),
    }
  }

  public async opepen({ params }: HttpContextContract) {
    return Opepen.query()
      .where('setId', params.id)
      .preload('image')
      .preload('ownerAccount')
      .orderByRaw(`(data->>'edition')::int`)
      .orderBy('set_edition_id')
  }

  public async collectors({ params }: HttpContextContract) {
    const collectors = await Account.query()
      .whereHas('opepen', (query) => {
        query.where('setId', params.id)
      })
      .withCount('opepen', (query) => {
        query.where('setId', params.id)
      })
      .preload('pfp')
      .orderBy('opepen_count', 'desc')

    return collectors
  }

  // Most popular sets by secondary-sale volume. Aggregates sale events joined to
  // their tokens' current set. Returns set ids + volume so the client can map to
  // already-loaded set data. Optional `window` in days narrows the period.
  public async popular({ request }: HttpContextContract) {
    const { limit = 8, window } = request.qs()

    const query = Database.from('events')
      .join('opepens', 'opepens.token_id', 'events.token_id')
      .where('events.contract', 'OPEPEN')
      .whereNotNull('events.value')
      .whereRaw(`events.value != '0'`)
      .whereNotNull('opepens.set_id')
      .groupBy('opepens.set_id')
      .select('opepens.set_id as set_id')
      .sum('events.value as volume')
      .count('* as sales')
      .orderByRaw('SUM(events.value::numeric) desc')
      .limit(Math.min(Number(limit), 50))

    if (window) {
      query.whereRaw(`events.timestamp > now() - interval '${parseInt(window)} days'`)
    }

    const rows = await query

    return rows.map((r) => ({
      set_id: r.set_id,
      volume: r.volume, // wei
      sales: Number(r.sales),
    }))
  }
}
