import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import Image from 'App/Models/Image'
import RichContentLink from 'App/Models/RichContentLink'
import { RichLinkData } from 'App/Models/types'
import { isAdmin } from 'App/Middleware/AdminAuth'
import SetModel from 'App/Models/Set'
import SetSubmission from 'App/Models/SetSubmission'

export default class RichContentLinksController extends BaseController {

  public async createOrUpdate ({ request, session }: HttpContextContract) {
    const admin = isAdmin(session)
    const account = await Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()

    const linksData: RichLinkData[] = request.input('links', [])
    const links: RichContentLink[] = []

    for (const data of linksData) {
      const linkAccount = await Account.query().where('address', data.address).first()
      const set = await SetModel.find(data.set_id)
      const submission = await SetSubmission.find(data.set_submission_id)

      // Validate...
      if (! admin) { // Admins are always allowed...
        if (
          account.address !== data.address ||
          (data.id && linkAccount?.address !== data.address) ||
          (data.set_id && set?.creator !== data.address) ||
          (data.set_submission_id && submission?.creator !== data.address)
        ) continue // Disregard links we're not allowed to update...
      }

      const link = await RichContentLink.firstOrCreate({ id: data.id })

      const [logoImage, coverImage] = await Promise.all([
        Image.findBy('uuid', request.input('logo_image_id', null)),
        Image.findBy('uuid', request.input('cover_image_id', null)),
      ])
      link.logoImageId = logoImage ? logoImage.id : null
      link.coverImageId = coverImage ? coverImage.id : null
      await Promise.all([
        link.load('logo'),
        link.load('cover'),
      ])

      link.address = data.address
      link.setId = data.set_id
      link.setSubmissionId = data.set_submission_id
      link.sortIndex = data.sort_index
      link.url = data.url
      link.title = data.title
      link.description = data.description

      await link.save()

      links.push(link)
    }

    return links
  }

}
