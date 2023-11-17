import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Image from 'App/Models/Image'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import { toDriveFromFileUpload } from 'App/Helpers/drive'

export default class ImagesController extends BaseController {
  public async store ({ request, session, response }: HttpContextContract) {
    const user = await Account.firstOrCreate({
      address: session.get('siwe')?.address?.toLowerCase()
    })

    const file = request.file('image', {
      size: '7mb',
    })

    if (! file) return response.badRequest('No file provided')
    if (
      !file.isValid ||
      !file.subtype ||
      !['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg'].includes(file.subtype?.toLowerCase())
    ) return response.badRequest(file.errors || 'Unsupported file format')

    const image = await Image.create({
      creator: user.address,
      versions: {},
    })
    const { fileType } = await toDriveFromFileUpload(file, image.uuid)
    image.type = fileType || 'png'
    await image.save()

    await image.generateScaledVersions()

    return image
  }

  public async show ({ params }: HttpContextContract) {
    return Image.query()
      .preload('aiImage', query => {
        query.whereNotNull('journeyStepId')
        query.preload('journeyStep', query => query.preload('journey'))
      })
      .where('uuid', params.id)
      .firstOrFail()
  }

  public async featured ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
    } = request.qs()

    const query = Image.query()
      .whereNotNull('featuredAt')
      .orderBy('featuredAt', 'desc')

    return query.paginate(page, limit)
  }
}
