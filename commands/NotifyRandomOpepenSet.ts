import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import pad from 'App/Helpers/pad'

export default class NotifyRandomOpepenSet extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:random_opepen_set'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    if (Math.random() > 0.09) {
      this.logger.info('Skipping featured tweet')
      return
    }

    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const minResult = await SetSubmission.query()
      .whereNotNull('setId')
      .min('botFeaturedCount as min_count')
      .first()

    if (!minResult || typeof minResult.$extras.min_count === 'undefined') return

    const minCount = minResult.$extras.min_count

    const submission = await SetSubmission.query()
      .whereNotNull('setId')
      .where('botFeaturedCount', minCount)
      .orderByRaw('random()')
      .first()

    if (!submission) return
    
    submission.botFeaturedCount++
    await submission.save()

    const img = `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/square`

    const setId = submission.setId
    const name = submission.name
    const creatorNames = await submission.creatorNamesForXStr()

    const lines = [
      `Featured Set ${pad(setId, 3)}: ${name}${creatorNames ? ` by ${creatorNames}` : ''}`,
      ``,
      `https://opepen.art/sets/${pad(setId, 3)}`,
    ]

    await this.notify(lines, img)
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
