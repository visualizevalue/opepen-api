import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import VerifyEmail from 'App/Mailers/VerifyEmail'
import Image from 'App/Models/Image'

export default class AccountSettingsController extends BaseController {

  public async show (config: HttpContextContract) {
    return this.transform(await this.get(config))
  }

  public async update (config: HttpContextContract) {
    const account = await this.get(config)

    // PFP & Cover
    const [pfpImage, coverImage] = await Promise.all([
      Image.findBy('uuid', config.request.input('pfp_image_id', null)),
      Image.findBy('uuid', config.request.input('cover_image_id', null)),
    ])
    account.pfpImageId = pfpImage ? pfpImage.id : null
    account.coverImageId = coverImage ? coverImage.id : null
    await Promise.all([
      account.load('pfp'),
      account.load('coverImage'),
    ])

    // Profile Data
    account.name = config.request.input('name', '')?.replace('.eth', '')
    account.tagline = config.request.input('tagline', '')
    account.quote = config.request.input('quote', '')
    account.bio = config.request.input('bio', '')
    account.socials = config.request.input('socials', [])

    // Notifications
    account.notificationNewSet = config.request.input('notification_new_set', false)

    // Email + Email Verification on change
    const previousEmail = account.email
    account.email = config.request.input('email', null)
    if (account.email !== previousEmail) {
      account.emailVerifiedAt = null
      await new VerifyEmail(account).sendLater()
    }

    // Save the account
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
    return Account.query()
      .where('address', session.get('siwe')?.address?.toLowerCase())
      .preload('pfp')
      .preload('coverImage')
      .preload('richContentLinks')
      .firstOrFail()
  }

  private transform (account: Account) {
    return {
      name: account.name,
      email: account.email,
      notification_new_set: account.notificationNewSet,
      pfp: account.pfp ? account.pfp.toJSON() : null,
      coverImage: account.coverImage ? account.coverImage.toJSON() : null,
      richContentLinks: account.richContentLinks || null,
      tagline: account.tagline,
      quote: account.quote,
      bio: account.bio,
      socials: account.socials,
    }
  }

}
