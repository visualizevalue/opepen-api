import { string } from '@ioc:Adonis/Core/Helpers'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { timeRemainingFromSeconds } from 'App/Helpers/time'
import pad from 'App/Helpers/pad'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/SetModel'
import SetSubmission from 'App/Models/SetSubmission'
import Twitter from './Twitter'

export class BotNotifications {
  xClient: Twitter|undefined
  initialized: boolean = false

  public async initialize () {
    if (this.initialized) return

    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    this.xClient = await Twitter.initialize(account)

    this.initialized = true

    Logger.info(`BotNotifications initialized to account ${account.address}`)

    return this.initialized
  }

  public async newSubmission (submission: SetSubmission) {
    await this.initialize()

    const creators = string.toSentence(await submission.creatorNamesForX())

    const lines = [
      `New Set Submitted: "${submission.name}"`,
      `${string.capitalCase(submission.editionType)} Editions by ${creators}`,
    ]
    Logger.info(`BotNotifications newSubmission ${lines.join('; ')}`)

    const txt = lines.join(`\n`)
    const img = `${Env.get('APP_URL')}/v1/frames/sets/${submission.uuid}/detail/image`

    await this.xClient?.tweet(txt, img)
  }

  public async newCuratedSubmission (submission: SetSubmission) {
    await this.initialize()

    const creators = string.toSentence(await submission.creatorNamesForX())

    const lines = [
      `New Curated Set: "${submission.name}"`,
      `${string.capitalCase(submission.editionType)} Editions by ${creators}`,
    ]
    Logger.info(`BotNotifications newSubmission ${lines.join('; ')}`)

    const txt = lines.join(`\n`)
    const img = `${Env.get('APP_URL')}/v1/frames/sets/${submission.uuid}/detail/image`

    await this.xClient?.tweet(txt, img)
  }

  public async consensusReached (submission: SetSubmission) {
    await this.initialize()

    const creators = string.toSentence(await submission.creatorNamesForX())

    const lines = [
      // FIXME: Check `resumed` computation
      `Consensus ${submission.countdownHasRun() ? 'Reached' : 'Reached'}`,
      `"${submission.name}" by ${creators}`,
      `${submission.timeRemainigStr()} left`,
    ]
    Logger.info(`BotNotifications consensusReached ${lines.join('; ')}`)

    const txt = lines.join(`\n`)
    const img = `${Env.get('APP_URL')}/v1/frames/sets/${submission.uuid}/detail/image`

    await this.xClient?.tweet(txt, img)
  }

  public async consensusPaused (submission: SetSubmission) {
    await this.initialize()

    const creators = string.toSentence(await submission.creatorNamesForX())

    const lines = [
      `Consensus Paused`,
      `"${submission.name}" by ${creators}`,
      `${timeRemainingFromSeconds(submission.remainingRevealTime)} left`
    ]
    Logger.info(`BotNotifications consensusPaused ${lines.join('; ')}`)

    const txt = lines.join(`\n`)
    const imgs = [
      `${Env.get('APP_URL')}/v1/frames/sets/${submission.uuid}/detail/image`,
      `${Env.get('APP_URL')}/v1/frames/sets/${submission.uuid}/opt-in-status/image`,
    ]

    await this.xClient?.tweet(txt, imgs)
  }

  // TODO: Closing Soon
  // “Title” by @artist
  // 3,463% demand
  // 1hr 00m remaining
  // [6up grid image preview]

  public async newSet (set: SetModel) {
    await this.initialize()

    await set.load('submission')
    const creators = string.toSentence(await set.submission.creatorNamesForX())

    const lines = [
      `"${set.submission.name}" by ${creators}`,
      `Permanent Collection, Set ${pad(set.id, 3)}`,
      `Published at Block ${set.submission.revealBlockNumber}`,
    ]
    Logger.info(`BotNotifications newSet ${lines.join('; ')}`)

    const txt = lines.join(`\n`)

    await this.xClient?.tweet(txt, `${Env.get('APP_URL')}/v1/frames/sets/${set.submission.uuid}/detail/image`)
  }

  public async provenance (submission: SetSubmission) {
    await this.initialize()

    const tweets = [
      { text: `Opepen Set "${submission.name}" reveal provenance thread...\n\n↓ https://opepen.art/sets/${submission.uuid}` },
      { text: `Reveal block hash: ${submission.revealBlockNumber} (in about 10 minutes) https://etherscan.io/block/${submission.revealBlockNumber}` },
      { text: `Opt in data hash: ${submission.revealSubmissionsInputCid}` },
    ]

    await this.xClient?.thread(tweets)
  }

}

export default new BotNotifications()
