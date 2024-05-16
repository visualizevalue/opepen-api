import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'

export default class NotifyDailyMovements extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:daily_movements'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Account } = await import('App/Models/Account')
    const { default: Event } = await import('App/Models/Event')
    const { default: Farcaster } = await import('App/Services/Farcaster')
    const { default: Twitter } = await import('App/Services/Twitter')

    // const deployment = DateTime.fromSeconds(1673158871)
    const today = DateTime.utc()
    const imageUrl = `https://api.opepen.art/v1/opepen/summary/${today.toISODate()}`

    const start = today.minus({ day: 1 })

    const events = await Event.query()
      .preload('opepen')
      .where('timestamp', '>=', start.toISO())
      .where('timestamp', '<=', today.toISO())

    const nodes = new Set(events.map(e => e.to))
    const previousEventsPerNode = await Event.query()
      .whereIn('to', Array.from(nodes))
      .where('timestamp', '<', start.toISO())
      .select('to')
      .count('to')
      .groupBy('to')

    const newNodes = new Set(nodes)
    for (const node of previousEventsPerNode) {
      if (parseInt(node.$extras.count) > 0) {
        newNodes.delete(node.to)
      }
    }

    const transfers: number = (await Event.query()
      .where('timestamp', '>=', start.toISO())
      .where('timestamp', '<=', today.toISO())
      .count('*', 'count'))[0].$extras.count

    if (events.length < 4) return

    const txt = [
      `Opepen Day`,
      ``,
      `New Nodes: ${newNodes.size}`,
      `Transfers: ${transfers}`,
    ].join('\n')

    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    const xClient = await Twitter.initialize(account)
    if (! xClient) return

    await xClient.tweet(txt, imageUrl)
    await Farcaster.cast(txt, imageUrl)
  }
}
