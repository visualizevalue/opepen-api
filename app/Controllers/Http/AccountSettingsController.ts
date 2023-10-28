import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import VerifyEmail from 'App/Mailers/VerifyEmail'

export default class AccountSettingsController extends BaseController {

  public async show (config: HttpContextContract) {
    return this.transform(await this.get(config))
  }

  public async update (config: HttpContextContract) {
    const account = await this.get(config)

    const previousEmail = account.email

    account.name = config.request.input('name', '')?.replace('.eth', '')
    account.email = config.request.input('email', null)
    account.notificationNewSet = config.request.input('notification_new_set', false)

    if (account.email !== previousEmail) {
      account.emailVerifiedAt = null
      await new VerifyEmail(account).sendLater()
    }

    await account.save()

    return this.transform(account)
  }

  public async verifyEmail ({ request, params, response }: HttpContextContract) {
    if (! request.hasValidSignature()) {
      return response.badRequest('Invalid signature')
    }

    const account = await Account.query().where('address', params.account).firstOrFail()
    account.emailVerifiedAt = DateTime.now()
    await account.save()

    return response.redirect('https://opepen.art?dialog=email_verified')
  }

  public async unsubscribeNotification ({ request, params, response }: HttpContextContract) {
    if (! request.hasValidSignature()) {
      return response.badRequest('Invalid signature')
    }

    const account = await Account.query().where('address', params.account).firstOrFail()
    account[string.camelCase(`notification_${params.type}`)] = false
    await account.save()

    return response.redirect(`https://opepen.art?dialog=notification_unsubscribed&type=${params.type}`)
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
