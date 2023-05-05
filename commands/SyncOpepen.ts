import { BaseCommand } from '@adonisjs/core/build/standalone'
import OpepenEdition from 'App/TokenStandards/OpepenEdition'

export default class SyncOpepen extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:sync'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Sync the blockchain state of current opepen ownership by parsing blockchain events'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    this.logger.info('Synching Opepen')

    const edition = await OpepenEdition.initialize()
    await edition.sync()

    this.logger.info('Done synching Opepen')
  }
}
