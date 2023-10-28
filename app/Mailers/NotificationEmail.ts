import mjml2html from 'mjml'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import Route from '@ioc:Adonis/Core/Route'
import View from '@ioc:Adonis/Core/View'
import Account from 'App/Models/Account'

export default class NotificationEmail extends BaseMailer {
  constructor (protected account: Account) {
    super()
  }

  public async prepareEmail(message: MessageContract, {
    subject = '',
    name = '',
    templateData = {}
  }: {
    subject: string,
    name: string, // new_set
    templateData: {[key:string]: string}
  }): Promise<MessageContract> {

    const data = {
      name: this.account.display,
      unsubscribeUrl: Route.makeSignedUrl(
        `unsubscribeNotification`,
        {
          account: this.account.address,
          type: name,
        },
        { prefixUrl: Env.get('APP_URL') }
      ),
      ...templateData,
    }

    const html = mjml2html(await View.render(`emails/notification_${name}@mjml`, data)).html

    return message
      .subject(subject)
      .from('opepen@vv.xyz', 'Opepen')
      .to(this.account.email)
      .html(html)
      .textView(`emails/notification_${name}@plain`, data)
  }
}
