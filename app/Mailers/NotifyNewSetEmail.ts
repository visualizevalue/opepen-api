import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import NotificationEmail from './NotificationEmail'
import pad from 'App/Helpers/pad'
import SetModel from 'App/Models/SetModel'
import { DateTime } from 'luxon'

export default class NotifyNewSetEmail extends NotificationEmail {
  constructor (protected account: Account, private set: SetModel) {
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
        optInUntil: this.set.submission.revealsAt.toUTC().toLocaleString(DateTime.DATETIME_FULL)
      },
    })
  }
}
