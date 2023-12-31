import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/SetModel'

export default class SetStatsController {

  public async listings({ params }: HttpContextContract) {
    const set = await SetModel.query()
      .where('id', params.id)
      .preload('opepen')
      .firstOrFail()

    const listingsGroupedByEdition = set.opepen.reduce((acc, opepen) => {
      if (opepen.price) {
        acc[opepen.data.edition] ++
      }

      return acc
    }, {
      "1": 0,
      "4": 0,
      "5": 0,
      "10": 0,
      "20": 0,
      "40": 0,
    })

    return {
      totals: listingsGroupedByEdition
    }
  }

}
