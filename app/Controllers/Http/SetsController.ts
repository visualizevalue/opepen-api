import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/SetModel'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import OpepenService from 'App/Services/OpepenService'
import Account from 'App/Models/Account'

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
}
