import mjml2html from 'mjml'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import Account from 'App/Models/Account'
import View from '@ioc:Adonis/Core/View'

export default class TestEmail extends BaseMailer {
  constructor (private account: Account) {
    super()
  }

  public async prepare(message: MessageContract) {
    const html = mjml2html(await View.render('emails/test@mjml', { name: this.account.display })).html

    message
      .subject('Test Email')
      .from('opepen@vv.xyz', 'Opepen')
      .to(this.account.email)
      .html(html)
      .textView('emails/test@plain', { name: this.account.display })
  }
}
