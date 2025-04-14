import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class UpdateOpepenNames extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'update:names'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Update the names of all Opepen tokens'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    const opepen = await Opepen.query().preload('set')

    for (const token of opepen) {
      await token.updateName()
    }
  }
}
