import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/SetModel'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'

export default class SetsController extends BaseController {
  public async list () {
    const sets = await SetModel.query()
      .preload('submission')
      .whereNotNull('submissionId')
      .orderBy('id')


    return sets.map(s => s.serialize({
      fields: {
        pick: ['id', 'name', 'description']
      }
    }))
  }

  public async show ({ params }: HttpContextContract) {
    const set = await SetModel.query()
      .preload('submission')
      .preload('replacedSubmission')
      .where('id', params.id)
      .firstOrFail()

    return set
  }

  public async opepen ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('setId', params.id)
      .preload('image')
      .preload('ownerAccount')
      .orderByRaw(`(data->>'edition')::int`)
      .orderBy('set_edition_id')
  }
}
