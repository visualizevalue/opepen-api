import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'

export default class NotifyRandomOpepen extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:random_opepen'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    if (Math.random() < 0.19) {
      this.logger.info(`Skipping featured tweet`)
      return
    }

    const opepen = await Opepen.query()
      .whereNotNull('imageId')
      .orderByRaw('random()')
      .preload('image')
      .firstOrFail()

    await this.notify([
      `Featured Opepen: ${opepen.name}`,
      `https://opepen.art/opepen/${opepen.tokenId}`
    ], `https://api.opepen.art/v1/render/opepen/${opepen?.tokenId}/og`)
  }

  private async notify (lines: string[], img: string) {
    const { default: Account } = await import('App/Models/Account')
    const { default: Twitter } = await import('App/Services/Twitter')
    const { default: Farcaster } = await import('App/Services/Farcaster')

    const txt = lines.join(`\n`)

    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    const xClient = await Twitter.initialize(account)
    if (! xClient) return

    await xClient.tweet(txt, img)
    await Farcaster.cast(txt, img)
  }
}
