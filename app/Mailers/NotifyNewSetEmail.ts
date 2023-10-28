import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import NotificationEmail from './NotificationEmail'
import pad from 'App/Helpers/pad'
import SetModel from 'App/Models/Set'
import { DateTime } from 'luxon'

export default class NotifyNewSetEmail extends NotificationEmail {
  constructor (protected account: Account, private set: SetModel) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    const paddedSetId = pad(this.set.id)

    return super.prepareEmail(message, {
      subject: 'New Opepen Set',
      name: 'new_set',
      templateData: {
        setId: paddedSetId,
        setName: this.set.name,
        setUrl: `https://opepen.art/sets/${paddedSetId}`,
        optInUntil: this.set.revealsAt.toUTC().toLocaleString(DateTime.DATETIME_FULL)
      },
    })
  }
}
