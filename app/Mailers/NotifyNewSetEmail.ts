import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import pad from 'App/Helpers/pad'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/SetModel'
import NotificationEmail from './NotificationEmail'

export default class NotifyNewSetEmail extends NotificationEmail {
  constructor(
    protected account: Account,
    private set: SetModel,
  ) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    const paddedSetId = pad(this.set.id)

    await this.set.load('submission')

    return super.prepareEmail(message, {
      subject: 'New Opepen Set',
      name: 'new_set',
      templateData: {
        setId: paddedSetId,
        setName: this.set.submission.name,
        setUrl: `https://opepen.art/sets/${paddedSetId}`,
        blockNumber: this.set.submission.revealBlockNumber,
      },
    })
  }
}
