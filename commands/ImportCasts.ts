import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
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

  @flags.boolean({ alias: 'a' })
  public all: boolean

  public async run() {
    const reverse = !this.all
    const allPages = !!this.all

    await FarcasterData.importCasts(reverse, allPages)
  }
}
