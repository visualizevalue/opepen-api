import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Drive from '@ioc:Adonis/Core/Drive'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import { DateTime } from 'luxon'
import DailyOpepen from 'App/Services/DailyOpepen'
import { Account } from 'App/Models'
import MetadataParser from 'App/Services/Metadata/MetadataParser'
import OpepenRenderer from 'App/Frames/OpepenRenderer'
import OpepenGrid from 'App/Services/OpepenGrid'

export default class OpepenController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      includes = [],
      sort = ''
    } = request.qs()

    const query = Opepen.query().preload('image')

    await this.applyIncludes(query, includes)
    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    query.orderBy('tokenId', 'asc')

    return query.paginate(page, limit)
  }

  public async show ({ params }: HttpContextContract) {
    const opepen = await Opepen.query()
      .where('tokenId', params.id)
      .preload('set')
      .preload('ownerAccount')
      .preload('image')
      .preload('lastEvent')
      .firstOrFail()

    const metadata = await (new MetadataParser()).forOpepen(opepen)

    return { ...opepen.toJSON(), metadata }
  }

  public async updateImage (context: HttpContextContract) {
    const opepen = await Opepen.query().where('tokenId', context.params.id).firstOrFail()
    await opepen.updateImage()
    return this.show(context)
  }

  public async forAccount ({ params, request }: HttpContextContract) {
    const {
      page = 1,
      limit = 16_000,
      filter = {},
      includes = [],
      sort = ''
    } = request.qs()

    const account = await Account.byId(params.id).firstOrFail()

    const query = Opepen.query()
      .where('owner', account.address)
      .preload('image')

    if (filter.edition) {
      query.whereJsonSuperset('data', { edition: parseInt(filter.edition) })
      delete filter.edition
    }

    await this.applyIncludes(query, includes)
    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      .orderBy('setId')
      .orderByRaw(`(data->>'edition')::int`)
      .paginate(page, limit)
  }

  public async summary ({ params, response, }: HttpContextContract) {
    const image = await DailyOpepen.forDay(DateTime.fromISO(params.date))

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  async gridForAccount (ctx: HttpContextContract) {
    const { params, request, response } = ctx
    const query = request.qs()
    const key = query.key || DateTime.now().toUnixInteger()
    const imagePath = `opepen-profile-grids/${params.id}-${key}.png`

    let image: Buffer
    if (await Drive.exists(imagePath)) {
      image = await Drive.get(imagePath)
    } else {
      const opepen = await this.forAccount(ctx)
      image = await OpepenGrid.make(
        opepen.map(c => c.tokenId.toString()),
        false,
        query.highlight?.split(',')
      )

      await Drive.put(imagePath, image, {
        contentType: 'image/png',
      })
    }

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  public async og ({ request, params, response }: HttpContextContract) {
    const opepen = await Opepen.query()
      .where('tokenId', params.id)
      .preload('submission')
      .preload('ownerAccount')
      .preload('events')
      .preload('image')
      .firstOrFail()

    const image = await OpepenRenderer.render(opepen, request.method() === 'POST')

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

}
