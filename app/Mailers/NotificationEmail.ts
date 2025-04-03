import mjml2html from 'mjml'
import { htmlToText } from 'html-to-text'
import { BaseMailer, MessageContract } from '@ioc:Adonis/Addons/Mail'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import Route from '@ioc:Adonis/Core/Route'
import View from '@ioc:Adonis/Core/View'
import Account from 'App/Models/Account'

export default class NotificationEmail extends BaseMailer {
  constructor(protected account: Account) {
    super()
  }

  public async prepareEmail(
    message: MessageContract,
    {
      subject = '',
      name = '',
      templateString = '',
      templateData = {},
    }: {
      subject: string
      name?: string // new_set
      templateString?: string
      templateData: { [key: string]: string | string[] }
    },
  ): Promise<MessageContract> {
    const html = await this.renderTemplate({ name, templateString, templateData })

    // Make sure we're sending notification in this environment
    if (!html || !Env.get('SEND_NOTIFICATIONS')) {
      Logger.info(`Email Notification held: ${html}`)
      return message
    }

    return message
      .subject(subject)
      .from('opepen@vv.xyz', 'Opepen')
      .to(this.account.email)
      .html(html)
      .text(htmlToText(html))
  }

  public async renderTemplate({
    name,
    templateString,
    templateData,
  }: {
    name: string
    templateString?: string
    templateData?: { [key: string]: string | string[] }
  }) {
    const data = {
      name: this.account.display,
      unsubscribeUrl: Route.makeSignedUrl(
        `unsubscribeNotification`,
        {
          account: this.account.address,
          type: name,
        },
        { prefixUrl: Env.get('APP_URL') },
      ),
      ...templateData,
    }

    return templateString
      ? mjml2html(await View.renderRaw(this.wrapTemplate(templateString), data)).html
      : mjml2html(await View.render(`emails/notification_${name}@mjml`, data)).html
  }

  private wrapTemplate(template: string) {
    return template.startsWith('<mjml>')
      ? template
      : `<mjml><mj-body><mj-section><mj-column>
          <mj-image width="32px" src="https://opepen.art/favicon.png"></mj-image>
          ${template}
        </mj-column></mj-section></mj-body></mjml>`
  }
}
