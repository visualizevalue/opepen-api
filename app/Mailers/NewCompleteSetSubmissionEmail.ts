import mjml2html from 'mjml'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import View from '@ioc:Adonis/Core/View'
import SetSubmission from 'App/Models/SetSubmission'

export default class TestEmail extends BaseMailer {
  constructor(private submission: SetSubmission) {
    super()
  }

  public async prepare(message: MessageContract) {
    const html = mjml2html(await View.render('emails/test@mjml', this.submission)).html

    message.subject('Test Email').from('opepen@vv.xyz', 'Opepen').to('jalil@vv.xyz').html(html)
  }
}
