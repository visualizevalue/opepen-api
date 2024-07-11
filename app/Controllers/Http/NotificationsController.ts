import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import NotifyGeneralEmail from 'App/Mailers/NotifyGeneralEmail'
import TestEmail from 'App/Mailers/TestEmail'
import Account from 'App/Models/Account'

export default class NotificationsController {

  public async general ({ request }: HttpContextContract) {
    const subject = request.input('subject')

    const users = await Account.query().withScopes(scopes => scopes.receivesEmail('General'))

    for (const user of users) {
      try {
        await new NotifyGeneralEmail(user, subject).sendLater()
        Logger.info(`SetNotification email scheduled: ${user.email}`)
      } catch (e) {
        console.log(e)
        Logger.warn(`Error scheduling SetNotification email: ${user.email}`)
      }
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
