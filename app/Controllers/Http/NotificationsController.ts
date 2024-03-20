import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Logger from '@ioc:Adonis/Core/Logger'
import NotifyGeneralEmail from 'App/Mailers/NotifyGeneralEmail'
import Account from 'App/Models/Account'

export default class NotificationsController {

  public async general (_: HttpContextContract) {
    const users = await Account.query().withScopes(scopes => scopes.receivesEmail('General'))

    for (const user of users) {
      try {
        await new NotifyGeneralEmail(user).sendLater()
        Logger.info(`SetNotification email scheduled: ${user.email}`)
      } catch (e) {
        console.log(e)
        Logger.warn(`Error scheduling SetNotification email: ${user.email}`)
      }
    }
  }

}
