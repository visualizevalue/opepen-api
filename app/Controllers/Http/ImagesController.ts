import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Image from 'App/Models/Image'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import { toDriveFromFileUpload } from 'App/Helpers/drive'
import NotAuthenticated from 'App/Exceptions/NotAuthenticated'
import InvalidInput from 'App/Exceptions/InvalidInput'
import BadRequest from 'App/Exceptions/BadRequest'

export default class ImagesController extends BaseController {
  public async store ({ request, session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase()

    if (! address) throw new NotAuthenticated()

    const user = await Account.firstOrCreate({
      address,
    })

    const file = request.file('image', {
      size: '10mb',
    })

    if (! file) throw new BadRequest(`No file provided`)
    if (
      !file.isValid ||
      !file.subtype ||
      !['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm'].includes(file.subtype?.toLowerCase())
    ) throw new InvalidInput(`Unspupported file format`)

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
      .where('uuid', params.id)
      .firstOrFail()
  }

  public async render ({ params, response }: HttpContextContract) {
    const image = await Image.query().where('uuid', params.id).firstOrFail()

    const { contentType, buffer } = await image.render()

    return response
      .header('Content-Type', contentType)
      .header('Content-Length', Buffer.byteLength(buffer))
      .send(buffer)
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
