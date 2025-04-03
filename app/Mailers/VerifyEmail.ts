import mjml2html from 'mjml'
import Env from '@ioc:Adonis/Core/Env'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import Route from '@ioc:Adonis/Core/Route'
import View from '@ioc:Adonis/Core/View'
import Account from 'App/Models/Account'

export default class VerifyEmail extends BaseMailer {
  constructor(private account: Account) {
    super()
  }

  public async prepare(message: MessageContract) {
    const data = {
      name: this.account.display,
      url: Route.makeSignedUrl(
        'verifyEmail',
        { account: this.account.address },
        { prefixUrl: Env.get('APP_URL') },
      ),
    }
    const html = mjml2html(await View.render('emails/verify@mjml', data)).html

    message
      .subject('Verify Your Email')
      .from('opepen@vv.xyz', 'Opepen')
      .to(this.account.email)
      .html(html)
      .textView('emails/verify@plain', data)
  }
}
