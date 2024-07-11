import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import NotificationEmail from './NotificationEmail'

export default class NotifyGeneralEmail extends NotificationEmail {
  constructor (protected account: Account) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: 'Consensus is temporary',
      name: 'general',
      templateData: {},
    })
  }
}
