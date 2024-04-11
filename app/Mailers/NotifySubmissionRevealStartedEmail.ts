import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'

export default class NotifySubmissionRevealStartedEmail extends NotificationEmail {
  constructor (protected account: Account, private submission: SetSubmission) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    // FIXME: Check `resumed` computation
    const actionVerb = this.submission.countdownHasRun() ? 'resumed' : 'reached'

    return super.prepareEmail(message, {
      subject: `Consensus ${actionVerb} on "${this.submission.name}"`,
      name: 'reveal_started',
      templateData: {
        setName: this.submission.name,
        actionVerb,
        artist: await this.submission.creatorNamesStr(),
        timeRemaining: this.submission.timeRemainigStr(),
        setUrl: `https://opepen.art/sets/${this.submission.uuid}`,
      },
    })
  }
}
