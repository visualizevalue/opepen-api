import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import NotificationEmail from './NotificationEmail'

export default class NotifyGeneralEmail extends NotificationEmail {
  constructor (
    protected account: Account,
    protected subject: string,
    protected templateString: string,
    protected templateData?: { [key: string]: string|string[] },
  ) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: this.subject,
      name: 'general',
      templateString: this.templateString,
      templateData: this.templateData || {},
    })
  }
}
