import Env from '@ioc:Adonis/Core/Env'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import ImportCollection from 'App/Services/ImportCollection'

export default class ImportOpepens extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:sync-all'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Force update opepen tokens and ownership'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    const service = new ImportCollection()

    await service.run(Env.get('OPEPEN_ADDRESS'), Opepen)
  }
}
