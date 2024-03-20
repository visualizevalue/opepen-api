import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import VerifyEmail from 'App/Mailers/VerifyEmail'
import Image from 'App/Models/Image'

export default class AccountSettingsController extends BaseController {

  public async showMe (config: HttpContextContract) {
    return this.transform(await this.me(config))
  }

  public async show (config: HttpContextContract) {
    return this.transform(await this.get(config.params.account))
  }

  public async updateMe (config: HttpContextContract) {
    const account = await this.me(config)

    return await this.updateAccount(account, config.request)
  }

  public async update (config: HttpContextContract) {
    const account = await this.get(config.params.account)

    return await this.updateAccount(account, config.request)
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

  private async updateAccount (account: Account, request) {
    // PFP & Cover
    const [pfpImage, coverImage] = await Promise.all([
      Image.findBy('uuid', request.input('pfp_image_id', null)),
      Image.findBy('uuid', request.input('cover_image_id', null)),
    ])
    account.pfpImageId = pfpImage ? pfpImage.id : null
    account.coverImageId = coverImage ? coverImage.id : null
    await Promise.all([
      account.load('pfp'),
      account.load('coverImage'),
    ])

    // Profile Data
    account.name = request.input('name', '')?.replace('.eth', '')
    account.tagline = request.input('tagline', '')
    account.quote = request.input('quote', '')
    account.bio = request.input('bio', '')
    account.socials = request.input('socials', [])

    // Notifications
    account.notificationNewSet = request.input('notification_new_set', false)
    account.notificationNewSubmission = request.input('notification_new_submission', false)
    account.notificationNewCuratedSubmission = request.input('notification_new_curated_submission', false)
    account.notificationRevealStarted = request.input('notification_reveal_started', false)
    account.notificationRevealPaused = request.input('notification_reveal_paused', false)

    // Email + Email Verification on change
    const previousEmail = account.email
    account.email = request.input('email', null)
    if (account.email !== previousEmail) {
      account.emailVerifiedAt = null
      await new VerifyEmail(account).sendLater()
    }

    // Save the account
    await account.save()

    return this.transform(account)
  }

  private async me ({ session }: HttpContextContract) {
    return this.get(session.get('siwe')?.address)
  }

  private async get (address: string) {
    return Account.query()
      .where('address', address.toLowerCase())
      .preload('pfp')
      .preload('coverImage')
      .preload('richContentLinks', query => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .firstOrFail()
  }

  private transform (account: Account) {
    return {
      name: account.name,
      email: account.email,
      notification_new_set: account.notificationNewSet,
      notification_new_submission: account.notificationNewSubmission,
      notification_new_curated_submission: account.notificationNewCuratedSubmission,
      notification_reveal_started: account.notificationRevealStarted,
      notification_reveal_paused: account.notificationRevealPaused,
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
