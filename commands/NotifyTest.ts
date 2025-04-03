import { args, BaseCommand } from '@adonisjs/core/build/standalone'

export default class NotifyTest extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:test'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public image: string

  @args.string()
  public text: string

  @args.string()
  public account: string

  public async run() {
    // const image = `https://opepenai.nyc3.digitaloceanspaces.com/images/ebd204cb-8f1a-4c8f-bf08-90cac556fce0.png`;
    // const text = `testing`;
    // const account = `0xe11da9560b51f8918295edc5ab9c0a90e9ada20b`

    const { default: Twitter } = await import('App/Services/Twitter')

    const { default: Account } = await import('App/Models/Account')

    const account = await Account.byId(this.account).firstOrFail()
    const xClient = await Twitter.initialize(account)
    if (!xClient) return

    await xClient.tweet(this.text, this.image)
  }
}
