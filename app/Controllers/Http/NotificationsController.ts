import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import NotifyGeneralEmail from 'App/Mailers/NotifyGeneralEmail'
import TestEmail from 'App/Mailers/TestEmail'
import Account from 'App/Models/Account'
import NotificationEmail from 'App/Mailers/NotificationEmail'

export default class NotificationsController {

  public async preview ({ session, request }: HttpContextContract) {
    const currentAddress = session.get('siwe')?.address?.toLowerCase()
    const user = await Account.byId(currentAddress).firstOrFail()
    const mail = new NotificationEmail(user)

    const users = await Account.query().withScopes(scopes => scopes.receivesEmail('General'))

    return {
      rendered: await mail.renderTemplate({
        name: 'general',
        templateString: request.input('template'),
        templateData: {},
      }),
      userCount: users.length,
    }
  }

  public async general ({ session, request }: HttpContextContract) {
    const subject = request.input('subject')
    const template = request.input('template')
    const test = request.input('test', true)

    const currentAddress = session.get('siwe')?.address?.toLowerCase()
    const user = await Account.byId(currentAddress).firstOrFail()

    const users = test
      ? [user]
      : await Account.query().withScopes(scopes => scopes.receivesEmail('General'))

    const sentEmails = new Set()

    for (const user of users) {
      if (sentEmails.has(user.email)) continue

      try {
        await new NotifyGeneralEmail(
          user,
          subject,
          template,
        ).sendLater()
        Logger.info(`General email scheduled: ${user.email}`)
      } catch (e) {
        console.log(e)
        Logger.warn(`Error scheduling SetNotification email: ${user.email}`)
      }

      sentEmails.add(user.email)
    }

    return {
      success: true
    }
  }

  public async testMail ({ params, response }: HttpContextContract) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    if (! account.email) {
      return response.badRequest(`User doesn't have an email.`)
    }

    return await new TestEmail(account).sendLater()
  }

}
