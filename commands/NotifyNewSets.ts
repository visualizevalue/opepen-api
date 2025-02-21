import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import Setting, { SETTINGS_KEYS } from 'App/Models/Setting'

export default class NotifyNewSets extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:new_sets'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  private async getLastNotificationTime (): Promise<[Setting, DateTime]> {
    const { default: Setting } = await import('App/Models/Setting')

    let setting = await Setting.findBy('key', SETTINGS_KEYS.NOTIFICATION_NEW_SETS)

    // Add default setting
    if (! setting) {
      setting = await Setting.create({
        key: SETTINGS_KEYS.NOTIFICATION_NEW_SETS,
        data: { lastSent: DateTime.utc().minus({ weeks: 1 }).toISO() }
      })
    }

    return [setting, DateTime.fromISO(setting.data.lastSent)]
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const [setting, lastSent] = await this.getLastNotificationTime()
    const until = DateTime.utc()
    const imageUrl = `${Env.get('APP_URL')}/v1/render/sets/summary/${lastSent.toISODate()}_${until.toISODate()}`

    const submissions = await SetSubmission.query()
      .where('published_at', '>', lastSent.toISO())
      .orderBy('published_at', 'desc')

    if (! submissions.length) return

    await this.notify([
      `Recently added Opepen Set Submissions`,
      ``,
      `Curate: https://opepen.art/curate`,
    ], imageUrl)

    setting.data.lastSent = until.toISO()
    await setting.save()
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
