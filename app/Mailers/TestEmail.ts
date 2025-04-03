import mjml2html from 'mjml'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import Route from '@ioc:Adonis/Core/Route'
import View from '@ioc:Adonis/Core/View'
import Account from 'App/Models/Account'

export default class TestEmail extends BaseMailer {
  constructor(private account: Account) {
    super()
  }

  public async prepare(message: MessageContract) {
    const data = {
      name: this.account.display,
      unsubscribeUrl: Route.makeSignedUrl(
        'unsubscribeNotification',
        {
          account: this.account.address,
          type: 'new_set',
        },
        { prefixUrl: Env.get('APP_URL') },
      ),
    }

    const html = mjml2html(await View.render('emails/test@mjml', data)).html

    message
      .subject('Test Email')
      .from('opepen@vv.xyz', 'Opepen')
      .to(this.account.email)
      .html(html)
      .textView('emails/test@plain', data)
  }
}
