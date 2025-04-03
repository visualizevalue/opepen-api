import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { maxBigInt } from 'App/Helpers/bigints'
import SetModel from 'App/Models/SetModel'

export default class SetStatsController {
  public async listings({ params }: HttpContextContract) {
    const set = await SetModel.query().where('id', params.id).preload('opepen').firstOrFail()

    const listingsGroupedByEdition = set.opepen.reduce(
      (acc, opepen) => {
        if (opepen.price) {
          acc[opepen.data.edition]++
        }

        return acc
      },
      {
        '1': 0,
        '4': 0,
        '5': 0,
        '10': 0,
        '20': 0,
        '40': 0,
      },
    )

    const groupedPriceDefaults: {
      '1': null | bigint
      '4': null | bigint
      '5': null | bigint
      '10': null | bigint
      '20': null | bigint
      '40': null | bigint
    } = {
      '1': null,
      '4': null,
      '5': null,
      '10': null,
      '20': null,
      '40': null,
    }
    const listingPricesGroupedByEdition = set.opepen.reduce((acc, opepen) => {
      if (opepen.price) {
        acc[opepen.data.edition] =
          acc[opepen.data.edition] === null
            ? (opepen.price as bigint)
            : maxBigInt(opepen.price as bigint, acc[opepen.data.edition] as bigint)
      }

      return acc
    }, groupedPriceDefaults)

    return {
      totals: listingsGroupedByEdition,
      floors: listingPricesGroupedByEdition,
    }
  }
}
