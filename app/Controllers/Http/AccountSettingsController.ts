import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'

export default class AccountSettingsController extends BaseController {

  public async show (config: HttpContextContract) {
    return this.transform(await this.get(config))
  }

  public async update (config: HttpContextContract) {
    const account = await this.get(config)

    account.name = config.request.input('name', null)
    account.email = config.request.input('email', null)
    account.notificationNewSet = config.request.input('notification_new_set', false)

    await account.save()

    return this.transform(account)
  }

  private async get ({ session }: HttpContextContract) {
    return Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()
  }

  private transform (account: Account) {
    return {
      name: account.name,
      email: account.email,
      notification_new_set: account.notificationNewSet,
    }
  }

}
