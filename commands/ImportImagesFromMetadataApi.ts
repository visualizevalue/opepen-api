import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import { delay } from 'App/Helpers/time'
import OpenSea from 'App/Services/OpenSea'

export default class ImportSetImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:import-set-images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import images from metadata api (used for dynamic sets)'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  @flags.string()
  public edition: string

  @flags.boolean()
  public opensea: boolean = true

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: SetModel } = await import('App/Models/SetModel')

    this.logger.info(`Importing images from metadata api for set #${this.set}`)

    const set = await SetModel.query().where('id', this.set).preload('submission').firstOrFail()

    const query = Opepen.query().where('setId', set.id)
    if (this.edition) {
      query.whereRaw(`"data"->>'edition' = ?`, [this.edition])
    }

    const opepenInSet = await query

    if (this.opensea) {
      for (const opepen of opepenInSet) {
        await OpenSea.updateMetadata(opepen.tokenId.toString())

        await delay(500)
      }
    }
  }
}
