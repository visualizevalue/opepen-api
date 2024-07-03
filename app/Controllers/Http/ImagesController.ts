import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Image from 'App/Models/Image'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import { isAdmin } from 'App/Middleware/AdminAuth'
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

  public async curated ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
    } = request.qs()

    return Image.query()
      .has('votes')
      .preload('creatorAccount')
      .preload('cachedPost')
      .preload('cachedSetSubmission')
      .preload('cachedOpepen')
      .where('points', '>', 0)
      .orderBy('points', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, limit)
  }

  public async myCurated ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
    } = request.qs()

    return Image.query()
      .preload('votes')
      .preload('creatorAccount')
      .preload('cachedPost')
      .preload('cachedSetSubmission')
      .preload('cachedOpepen')
      .innerJoin('votes', query => query
        .on('votes.image_id', '=', 'images.id')
        .andOnVal('address', '=', session.get('siwe')?.address?.toLowerCase())
        .andOnVal('votes.points', '>', 0)
      )
      .select('images.*')
      .select('votes.created_at')
      .orderBy('votes.created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, limit)
  }

  public async curatedArt ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
      sort = '-points,-id',
      filterAddress = null,
    } = request.qs()

    const query = Image.votableQuery()
      .where('votesCount', '>', 0)
      .preload('creatorAccount')
      .preload('cachedSetSubmission')
      .preload('cachedOpepen')
      .preload('cachedPost')

    const authAddress = session.get('siwe')?.address?.toLowerCase()
    const address = isAdmin(session) ? filterAddress?.toLowerCase() : authAddress

    if (address) {
      query.where('creator', address)
    }

    this.applySorts(query, sort)

    return query.paginate(page, limit)
  }
}
