import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import VerifyEmail from 'App/Mailers/VerifyEmail'
import Image from 'App/Models/Image'
import BadRequest from 'App/Exceptions/BadRequest'
import { isAdmin } from 'App/Middleware/AdminAuth'
import NotAuthenticated from 'App/Exceptions/NotAuthenticated'
import NotAuthorized from 'App/Exceptions/NotAuthorized'

export default class AccountSettingsController extends BaseController {
  public async showMe(config: HttpContextContract) {
    return this.transform(await this.me(config))
  }

  public async show(config: HttpContextContract) {
    const account = await this.get(config.params.account)
    const me = await this.me(config)

    if (!isAdmin(config.session) && account.address !== me.address) {
      throw new NotAuthorized(`Not allowed to view this user`)
    }

    return this.transform(account)
  }

  public async updateMe(config: HttpContextContract) {
    const account = await this.me(config)

    return await this.updateAccount(account, config.request)
  }

  public async update(config: HttpContextContract) {
    const account = await this.get(config.params.account)
    const me = await this.me(config)

    if (!isAdmin(config.session) && account.address !== me.address) {
      throw new NotAuthorized(`Not allowed to update this user`)
    }

    return await this.updateAccount(account, config.request)
  }

  public async sendVerifyEmail({ params, session }: HttpContextContract) {
    const account = await this.get(params.account)

    const currentAddress = session.get('siwe')?.address?.toLowerCase()
    if (params.address?.toLowerCase() !== currentAddress && !isAdmin(session)) {
      throw new NotAuthenticated(`Can only request for yourself`)
    }

    if (account.emailVerifiedAt) throw new BadRequest(`Email already verified`)

    await new VerifyEmail(account).sendLater()
  }

  public async verifyEmail({ request, params, response }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.badRequest('Invalid signature')
    }

    const account = await Account.query().where('address', params.account).firstOrFail()
    account.emailVerifiedAt = DateTime.now()
    await account.save()

    return response.redirect('https://opepen.art?dialog=email_verified')
  }

  public async unsubscribeNotification({ request, params, response }: HttpContextContract) {
    if (!request.hasValidSignature()) {
      return response.badRequest('Invalid signature')
    }

    const account = await Account.query().where('address', params.account).firstOrFail()
    account[string.camelCase(`notification_${params.type}`)] = false
    await account.save()

    return response.redirect(
      `https://opepen.art?dialog=notification_unsubscribed&type=${params.type}`,
    )
  }

  private async updateAccount(account: Account, request) {
    // PFP & Cover
    await Promise.all([account.load('pfp'), account.load('coverImage')])
    const [pfpImage, coverImage] = await Promise.all([
      Image.findBy('uuid', request.input('pfp_image_id', account.pfp?.uuid ?? null)),
      Image.findBy('uuid', request.input('cover_image_id', account.coverImage?.uuid ?? null)),
    ])
    account.pfpImageId = pfpImage?.id || null
    account.coverImageId = coverImage?.id || null
    await Promise.all([account.load('pfp'), account.load('coverImage')])

    // Profile Data
    account.name = request.input('name', account.name)?.replace('.eth', '')
    account.tagline = request.input('tagline', account.tagline)
    account.socials = request.input('socials', account.socials)
    account.quote = request.input('quote', account.quote)
    account.bio = request.input('bio', account.bio)

    // Notifications
    account.notificationNewCuratedSubmission = request.input(
      'notification_new_curated_submission',
      account.notificationNewCuratedSubmission,
    )
    account.notificationNewSubmission = request.input(
      'notification_new_submission',
      account.notificationNewSubmission,
    )
    account.notificationRevealStarted = request.input(
      'notification_reveal_started',
      account.notificationRevealStarted,
    )
    account.notificationRevealPaused = request.input(
      'notification_reveal_paused',
      account.notificationRevealPaused,
    )
    account.notificationGeneral = request.input(
      'notification_general',
      account.notificationGeneral,
    )
    account.notificationNewSet = request.input(
      'notification_new_set',
      account.notificationNewSet,
    )

    // Email + Email Verification on change
    const previousEmail = account.email
    account.email = request.input('email', null)
    if (account.email !== previousEmail) {
      account.emailVerifiedAt = null
    }
    if (!account.emailVerifiedAt) {
      await new VerifyEmail(account).sendLater()
    }

    // Save the account
    await account.save()

    // Update the completion rank
    await account.updateProfileCompletion()

    return this.transform(account)
  }

  private async me({ session }: HttpContextContract) {
    return this.get(session.get('siwe')?.address)
  }

  private async get(address: string) {
    return Account.query()
      .where('address', address.toLowerCase())
      .preload('pfp')
      .preload('coverImage')
      .preload('richContentLinks', (query) => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .firstOrFail()
  }

  private transform(account: Account) {
    return {
      address: account.address,
      name: account.name,
      email: account.email,
      email_verified: !!account.emailVerifiedAt,
      notification_general: account.notificationGeneral,
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
      x_user: account.oauth?.twitterUser,
    }
  }
}
