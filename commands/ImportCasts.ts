import { BaseCommand } from '@adonisjs/core/build/standalone'
import FarcasterData from 'App/Services/FarcasterData'

export default class ImportCasts extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'farcaster:import-casts'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import Opepen Casts'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    await FarcasterData.importCasts()
  }
}
