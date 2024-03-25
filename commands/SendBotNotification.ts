import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class SendBotNotification extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'bot:curated'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public uuid: string

  public async run() {
    const { default: BotNotifications } = await import('App/Services/BotNotifications')
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const submission = await SetSubmission.query().where('uuid', this.uuid).firstOrFail()

    await BotNotifications.newCuratedSubmission(submission)
  }
}
