import { Duration } from 'luxon'
import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'

export default class NotifySubmissionRevealPausedEmail extends NotificationEmail {
  constructor (protected account: Account, private submission: SetSubmission) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    const timeRemaining = Duration
      .fromObject({ seconds: this.submission.remainingRevealTime })
      .shiftTo('hours', 'minutes', 'seconds')

    return super.prepareEmail(message, {
      subject: `Consensus paused on "${this.submission.name}"`,
      name: 'submission_reveal_paused',
      templateData: {
        setName: this.submission.name,
        artist: this.submission.artist,
        timeRemaining: `${timeRemaining?.hours}h ${timeRemaining?.minutes}m`,
        setUrl: `https://opepen.art/sets/${this.submission.uuid}`,
      },
    })
  }
}
