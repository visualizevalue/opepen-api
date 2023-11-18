import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class NotifyNewSet extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:notify-publish'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Notify users that have subscribed to new set notifications'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  public async run() {
    const { default: SetModel } = await import('App/Models/SetModel')

    const set = await SetModel.findOrFail(this.set)

    await set.notifyPublished()

    this.logger.info(`All emails sent.`)
  }
}
