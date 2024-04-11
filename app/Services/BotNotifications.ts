import { string } from '@ioc:Adonis/Core/Helpers'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { timeRemainingFromSeconds } from 'App/Helpers/time'
import pad from 'App/Helpers/pad'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/SetModel'
import SetSubmission from 'App/Models/SetSubmission'
import Twitter from './Twitter'
import Farcaster from './Farcaster'

export class BotNotifications {
  xClient: Twitter|undefined
  fcClient = Farcaster

  public async initialize () {
    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    this.xClient = await Twitter.initialize(account)

    Logger.info(`BotNotifications initialized to account ${account.address}`)
  }

  public async newSubmission (submission: SetSubmission) {
    const template = ({ creators }) => [
      `New Set Submitted: "${submission.name}"`,
      `${string.capitalCase(submission.editionType)} Editions by ${creators}`,
    ]

    const img = `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/square`

    await this.sendForSubmission(submission, template, img)
  }

  public async newCuratedSubmission (submission: SetSubmission) {
    const template = ({ creators }) => [
      `New Curated Set: "${submission.name}"`,
      `${string.capitalCase(submission.editionType)} Editions by ${creators}`,
    ]

    const img = `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/square`

    await this.sendForSubmission(submission, template, img)
  }

  public async consensusReached (submission: SetSubmission) {
    const template = ({ creators }) => [
      `Consensus ${submission.countdownHasRun() ? 'Resumed' : 'Reached'}`,
      `"${submission.name}" by ${creators}`,
      `${submission.timeRemainigStr()} left`,
    ]

    const img = `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/square`

    await this.sendForSubmission(submission, template, img)
  }

  public async consensusPaused (submission: SetSubmission) {
    const template = ({ creators }) => [
      `Consensus Paused`,
      `"${submission.name}" by ${creators}`,
      `${timeRemainingFromSeconds(submission.remainingRevealTime)} left`
    ]

    const imgs = [
      `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/square`,
      `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/opt-in-status`,
    ]

    await this.sendForSubmission(submission, template, imgs)
  }

  // TODO: Closing Soon
  // “Title” by @artist
  // 3,463% demand
  // 1hr 00m remaining
  // [6up grid image preview]

  public async newSet (set: SetModel) {
    await set.load('submission')

    const template = ({ creators }) => [
      `"${set.submission.name}" by ${creators}`,
      `Permanent Collection, Set ${pad(set.id, 3)}`,
      `Published at Block ${set.submission.revealBlockNumber}`,
    ]

    const img = `${Env.get('APP_URL')}/v1/render/sets/${set.submission.uuid}/square`

    await this.sendForSubmission(set.submission, template, img)
  }

  public async provenance (submission: SetSubmission) {
    await this.initialize()

    const posts = [
      { text: `Opepen Set "${submission.name}" reveal provenance thread...\n\n↓ https://opepen.art/sets/${submission.uuid}` },
      { text: `Reveal block hash: ${submission.revealBlockNumber} (in about 10 minutes) https://etherscan.io/block/${submission.revealBlockNumber}` },
      { text: `Opt in data hash: ${submission.revealSubmissionsInputCid}` },
    ]

    await this.xClient?.thread(posts)
    await this.fcClient?.thread(posts)
  }

  private async sendForSubmission (submission: SetSubmission, template: Function, images: string|string[]) {
    // Make sure we have valid API keys, and any other setup
    await this.initialize()

    // Get the creator list for different platforms
    const creators  = string.toSentence(await submission.creatorNames())
    const xCreators = string.toSentence(await submission.creatorNamesForX())

    // Function to render the given template.
    const render = (creators, delimiter = '\n') => template({ creators }).join(delimiter)

    // Log the tweet.
    Logger.info(`BotNotification: ${render(creators, '; ')}`)

    // Send to the networks
    await this.xClient?.tweet(render(xCreators), images)
    await this.fcClient?.cast(render(creators), images)
  }

}

export default new BotNotifications()
