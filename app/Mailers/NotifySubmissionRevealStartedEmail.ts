import { DateTime } from 'luxon'
import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'
import { timeRemaining } from 'App/Helpers/time'

export default class NotifySubmissionRevealStartedEmail extends NotificationEmail {
  constructor (protected account: Account, private submission: SetSubmission) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: `Consensus reached on "${this.submission.name}"`,
      name: 'reveal_started',
      templateData: {
        setName: this.submission.name,
        artist: await this.submission.creatorNamesStr(),
        timeRemaining: timeRemaining(this.submission.revealsAt?.diff(DateTime.now())),
        setUrl: `https://opepen.art/sets/${this.submission.uuid}`,
      },
    })
  }
}
