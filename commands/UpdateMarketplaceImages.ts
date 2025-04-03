import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import { delay } from 'App/Helpers/time'
import OpenSea from 'App/Services/OpenSea'

export default class UpdateMarketplaceImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:update-marketplace-images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Update third party image cache'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  @flags.string()
  public edition: string

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: SetModel } = await import('App/Models/SetModel')

    const set = await SetModel.query()
      .where('id', this.set)
      .preload('submission')
      .firstOrFail()

    const query = Opepen.query().where('setId', set.id)
    if (this.edition) {
      query.whereRaw(`"data"->>'edition' = ?`, [this.edition])
    }

    const opepenInSet = await query

    for (const opepen of opepenInSet) {
      await OpenSea.updateMetadata(`${opepen.tokenId}`)
      await delay(200)
    }
  }
}
