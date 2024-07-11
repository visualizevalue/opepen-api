import { MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import NotificationEmail from './NotificationEmail'

type GeneralTemplateData = {
  heading: string
  body: string[]
  action_url: string
  action_text: string
  footer: string
}

export default class NotifyGeneralEmail extends NotificationEmail {
  constructor (
    protected account: Account,
    protected subject: string,
    protected templateData: GeneralTemplateData,
  ) {
    super(account)
  }

  public async prepare(message: MessageContract) {
    return super.prepareEmail(message, {
      subject: this.subject,
      name: 'general',
      templateData: this.templateData,
    })
  }
}
