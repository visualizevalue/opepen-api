import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import Account from 'App/Models/Account'
import Opepen from 'App/Models/Opepen'
import Event from 'App/Models/Event'
import Setting from 'App/Models/Setting'
import Twitter from 'App/Services/Twitter'
import Farcaster from 'App/Services/Farcaster'
import ImportSales from 'App/Services/ImportSales'
import { SETTINGS_KEYS } from 'App/Models/Setting'
import { formatDuration } from 'App/Helpers/dates'
import { formatEther } from 'ethers/lib/utils'

export default class NotifyNodes extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'notify:nodes'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const setting = await Setting.findByOrFail('key', SETTINGS_KEYS.NOTIFICATION_NODES)
    const movementsSince = DateTime.fromISO(setting.data.updatedAt)

    // Make sure we have all sales imported
    await (new ImportSales()).sync()

    this.logger.info(`Computing node movements since ${movementsSince.toISO()}`)

    const eventsPerNode = await this.getEventsPerNode(movementsSince)
    const lastEvent = await Event.query()
      .where('contract', 'OPEPEN')
      .where('from', '!=', ethers.constants.AddressZero)
      .where('to', '!=', ethers.constants.AddressZero)
      .orderBy('timestamp', 'desc')
      .firstOrFail()

    for (const node of Object.keys(eventsPerNode)) {
      await this.handleNode(eventsPerNode[node].account, eventsPerNode[node].events)
    }

    // Update settings
    setting.data.updatedAt = lastEvent.timestamp
    await setting.save()
  }

  private async getEventsPerNode (movementsSince: DateTime) {
    const events = await Event.query()
      .where('contract', 'OPEPEN')
      .where('from', '!=', ethers.constants.AddressZero)
      .where('to', '!=', ethers.constants.AddressZero)
      .where('timestamp', '>', movementsSince.toSQL())
      .preload('opepen')

    const groups = {}

    for (const event of events) {
      if (! groups[event.to]) {
        groups[event.to] = {
          events: [],
          account: await Account.byId(event.to).firstOrFail(),
        }
      }

      groups[event.to].events.push(event)
    }

    return groups
  }

  private async handleNode (account: Account, events: Event[]) {
    const previouslyOwnedOpepens = await Event.query().where('to', account.address).count('*', 'owned')
    const ownedOpepens = await Opepen.query().where('owner', account.address).count('*', 'owned')

    const previouslyOwnedCount = parseInt(previouslyOwnedOpepens[0].$extras.owned)
    const ownedCount = parseInt(ownedOpepens[0].$extras.owned)

    if (ownedCount === 0) {
      this.logger.info(`Node ${account.display} sold everything in the meantime`)
      return
    }
    if (events.length > ownedCount) {
      this.logger.info(`Node ${account.display} sold in the meantime, skip (likely a bot)`)
      return
    }
    this.logger.info(`Node ${account.display} has received/bought ${events.length} Opepen`)

    const imageURI = `https://api.opepen.art/v1/accounts/${account.address}/opepen/grid.png?key=${DateTime.now().toUnixInteger()}`

    const value = events.reduce((value, event) => BigInt(value) + BigInt(event.value || 0), BigInt(0))
    const action = value > 0n ? `Acquired` : `Received`
    const opepenStr = events.length > 2
      ? `${events.length} Opepen`
      : `${events.map(e => e.opepen.name).join(' & ')}`
    const actionString = `${action} ${opepenStr} ${value > 0n ? `(Ξ${formatEther(value)})` : ''}`

    // New node
    if (previouslyOwnedCount === ownedCount && ownedCount === events.length) {
      const msg = [
        `New Node ${account.display}`,
        actionString,
      ]
      await this.notify(msg, imageURI)
    }
    // Expanding node
    else if (ownedCount > events.length) {
      const msg = [
        `Expanding Node ${account.display}`,
        actionString,
        `Owns ${ownedCount} Opepen`,
      ]

      msg.push(`Node uptime: ${formatDuration(await account.timeHeld())}`)

      await this.notify(msg, `${imageURI}&highlight=${events.map(e => e.tokenId).join(',')}`)
    }
    // Returning node
    else {
      const lastOwnedOpepen = await Event.query().where('from', account.address).orderBy('timestamp', 'desc').first()
      if (! lastOwnedOpepen) return

      const diff = DateTime.now().diff(lastOwnedOpepen.timestamp)
      if (diff.days < 30) return

      const msg = [
        `Returning Node ${account.display}`,
        actionString,
      ]

      msg.push(`Node downtime: ${formatDuration(diff)}`)

      await this.notify(msg, imageURI)
    }
  }

  private async notify (lines: string[], img: string) {
    this.logger.info(lines.join('; ') + ' ' + img)

    const txt = lines.join(`\n`)

    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    const xClient = await Twitter.initialize(account)
    if (! xClient) return

    try {
      await xClient.tweet(txt, img)
    } catch (e) {
      this.logger.error(`NotifyNodes: Issue sending X post `)
    }
    try {
      await Farcaster.cast(txt, img)
    } catch (e) {
      this.logger.error(`NotifyNodes: Issue sending Farcaster post`)
    }

  }
}
