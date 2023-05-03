import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Drive from '@ioc:Adonis/Core/Drive'
import Opepen from 'App/Models/Opepen'
import { DateTime } from 'luxon'

export default class ImportOpepenWinners extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:import-winners'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import the winners of a set for opepen'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  public async run() {
    this.logger.info('Importing Opepen winners')

    const winners = JSON.parse((await Drive.get(`sets/${this.set}/winners.json`)).toString())

    for (const edition in winners) {
      const opepenIds = winners[edition]

      let editionId = 1
      for (const id of opepenIds) {
        const opepen = await Opepen.find(id)

        if (! opepen) continue

        opepen.revealedAt = DateTime.now()
        opepen.setId = parseInt(this.set)
        opepen.setEditionId = editionId
        await opepen.save()

        editionId++
      }
    }
  }
}
