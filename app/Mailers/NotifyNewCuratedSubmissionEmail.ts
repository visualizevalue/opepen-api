import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import NotificationEmail from './NotificationEmail'

export default class NotifyNewCuratedSubmissionEmail extends NotificationEmail {
  constructor(
    protected account: Account,
    private submission: SetSubmission,
  ) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: 'New Curated Opepen Set',
      name: 'new_curated_submission',
      templateData: {
        setName: this.submission.name,
        setImageUrl: `https://api.opepen.art/v1/render/sets/${this.submission.uuid}/og`,
        artist: await this.submission.creatorNamesStr(),
        type: this.submission.editionType.toLowerCase(),
        setUrl: `https://opepen.art/submissions/${this.submission.uuid}`,
      },
    })
  }
}
