import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import Twitter from './Twitter'

export class BotNotifications {
  xClient: Twitter

  constructor (xClient: Twitter) {
    this.xClient = xClient
  }

  public static async initialize (address: string = `0xed029061b6e3d873057eeefd3be91121e103ea44`) {
    const xClient = await Twitter.initialize(await Account.findByOrFail('address', address))

    if (! xClient) return

    return new BotNotifications(xClient)
  }

  public async newSubmission (submission: SetSubmission) {
    await submission.load('creatorAccount')

    const lines = [
      `New Set Submitted`,
      `"${submission.name}"`,
      string.capitalCase(submission.editionType),
      `By ${submission.creatorAccount.display}`, // TODO: Add social platform handle
    ]

    const txt = lines.join(`\n`)
    const img = `https://api.opepen.art/sets/${submission.uuid}/detail/image` // TODO: Update image URI

    await this.xClient.tweet(txt, img)
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

  public async provenance (submission: SetSubmission) {
    const tweets = [
      { text: `Opepen Set "${submission.name}" reveal provenance thread...\n\n↓ https://opepen.art/sets/${submission.uuid}` },
      { text: `Reveal Block Hash: ${submission.revealBlockNumber} (in about 10 minutes) https://etherscan.io/block/${submission.revealBlockNumber}` },
      { text: `Opt in data hash: ${submission.revealSubmissionsInputCid}` },
    ]

    await this.xClient.thread(tweets)
  }

}

export default await BotNotifications.initialize()
