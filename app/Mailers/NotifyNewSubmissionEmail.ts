import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'

export default class NotifyNewSubmissionEmail extends NotificationEmail {
  constructor (protected account: Account, private submission: SetSubmission) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: 'New Opepen Set Submitted',
      name: 'new_submission',
      templateData: {
        setName: this.submission.name,
        artist: await this.submission.creatorNamesStr(),
        type: string.capitalCase(this.submission.editionType),
        setUrl: `https://opepen.art/sets/${this.submission.uuid}`,
      },
    })
  }
}
