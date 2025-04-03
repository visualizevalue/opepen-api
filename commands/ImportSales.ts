import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class ImportSales extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:import-sales'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import marketplace activity'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: ImportSales } = await import('App/Services/ImportSales')

    await new ImportSales().sync()
  }
}
