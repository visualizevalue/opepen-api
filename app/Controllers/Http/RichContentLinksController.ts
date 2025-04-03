import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import Image from 'App/Models/Image'
import RichContentLink from 'App/Models/RichContentLink'
import { RichLinkData } from 'App/Models/types'
import { isAdmin } from 'App/Middleware/AdminAuth'
import SetModel from 'App/Models/SetModel'
import SetSubmission from 'App/Models/SetSubmission'

export default class RichContentLinksController extends BaseController {
  public async createOrUpdate({ request, session }: HttpContextContract) {
    const admin = isAdmin(session)
    const account = await Account.query()
      .where('address', session.get('siwe')?.address?.toLowerCase())
      .firstOrFail()

    const linksData: RichLinkData[] = request.input('links', [])
    const links: RichContentLink[] = []

    for (const data of linksData) {
      const address = data.address?.toLowerCase()
      const linkAccount = await Account.query().where('address', address).first()
      const set = data.set_id
        ? await SetModel.query().preload('submission').where('id', data.set_id).first()
        : null
      const submission = data.set_submission_id
        ? await SetSubmission.find(data.set_submission_id)
        : null

      // Validate...
      if (!admin) {
        // Admins are always allowed...
        if (
          account.address !== address ||
          (data.id && linkAccount?.address !== address) ||
          (data.set_id && set?.submission.creator !== address) ||
          (data.set_submission_id && submission?.creator !== address)
        )
          continue // Disregard links we're not allowed to update...
      }

      const link = data.id ? await RichContentLink.findOrFail(data.id) : new RichContentLink()

      const [logoImage, coverImage] = await Promise.all([
        Image.findBy('uuid', data.logo_image_id || null),
        Image.findBy('uuid', data.cover_image_id || null),
      ])
      link.logoImageId = logoImage ? logoImage.id : null
      link.coverImageId = coverImage ? coverImage.id : null

      link.address = address
      link.setId = data.set_id
      link.setSubmissionId = data.set_submission_id
      link.sortIndex = data.sort_index
      link.url = data.url
      link.title = data.title
      link.description = data.description

      await link.save()
      await Promise.all([link.load('logo'), link.load('cover')])

      links.push(link)
    }

    return links
  }

  public async destroy({ params, response, session }: HttpContextContract) {
    const link = await RichContentLink.findOrFail(params.id)
    const account = await Account.query()
      .where('address', session.get('siwe')?.address?.toLowerCase())
      .firstOrFail()

    if (!isAdmin(session) && link.address !== account.address)
      return response.unauthorized('Not allowed')

    await link.delete()

    return response.ok('Link deleted')
  }
}
