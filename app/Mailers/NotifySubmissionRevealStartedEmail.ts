import { DateTime } from 'luxon'
import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'

export default class NotifySubmissionRevealStartedEmail extends NotificationEmail {
  constructor (protected account: Account, private submission: SetSubmission) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    const timeRemaining = this.submission.revealsAt?.diff(DateTime.now()).shiftTo('hours', 'minutes', 'seconds')

    return super.prepareEmail(message, {
      subject: `Consensus Reached on "${this.submission.name}"`,
      name: 'submission_reveal_started',
      templateData: {
        setName: this.submission.name,
        artist: this.submission.artist,
        timeRemaining: `${timeRemaining?.hours}h ${timeRemaining?.minutes}m`,
        setUrl: `https://opepen.art/sets/${this.submission.uuid}`,
      },
    })
  }
}
