import { string } from '@ioc:Adonis/Core/Helpers'
import Env from '@ioc:Adonis/Core/Env'
import Twitter from './Twitter'
import Account from 'App/Models/Account'

export class BotNotifications {
  xClient: Twitter|undefined
  initialized: boolean = false

  public async initialize () {
    if (this.initialized) return

    const account = await Account.byId(Env.get('TWITTER_BOT_ACCOUNT_ADDRESS')).firstOrFail()
    this.xClient = await Twitter.initialize(account)

    this.initialized = true

    return this.initialized
  }

  public async newSubmission (submission) {
    await this.initialize()

    await submission.load('creatorAccount')

    const lines = [
      `New Set Submitted`,
      `"${submission.name}"`,
      string.capitalCase(submission.editionType),
      `By ${submission.creatorAccount.display}`, // TODO: Add social platform handle
    ]

    const txt = lines.join(`\n`)
    const img = `https://api.opepen.art/sets/${submission.uuid}/detail/image` // TODO: Update image URI

    await this.xClient?.tweet(txt, img)
  }


  // TODO: Consensus Reached (Set 033)
  // “Title” by @artist
  // 24hr 00m remaining
  // [6up grid image preview]


  // TODO: Consensus Paused (1x)
  // “Title” by @artist
  // 18h 43m remaining
  // [6up grid image preview]


  // TODO: Closing Soon
  // “Title” by @artist
  // 3,463% demand
  // 1hr 00m remaining
  // [6up grid image preview]


  // TODO: Published
  // “Title” by @artist
  // Set 033
  // Published at Block 24893434
  // [6up grid image preview]

  public async provenance (submission) {
    await this.initialize()

    const tweets = [
      { text: `Opepen Set "${submission.name}" reveal provenance thread...\n\n↓ https://opepen.art/sets/${submission.uuid}` },
      { text: `Reveal Block Hash: ${submission.revealBlockNumber} (in about 10 minutes) https://etherscan.io/block/${submission.revealBlockNumber}` },
      { text: `Opt in data hash: ${submission.revealSubmissionsInputCid}` },
    ]

    await this.xClient?.thread(tweets)
  }

}

export default new BotNotifications()
