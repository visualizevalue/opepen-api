import ogs from 'open-graph-scraper'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import OpenGraphUrl from 'App/Models/OpenGraphUrl'

export default class OpenGraphController extends BaseController {

  public async show ({ request }: HttpContextContract) {
    const { url } = request.qs()
    let og = await OpenGraphUrl.findBy('url', url)

    if (! og) {
      const { result } = await ogs({ url })

      og = await OpenGraphUrl.create({
        url,
        title: result.ogTitle,
        description: result.ogDescription,
        image: result.ogImage?.length ? result.ogImage[0].url : '',
        data: {
          type: result.ogType,
          images: result.ogImage,
          favicon: result.favicon,
          charset: result.charset,
          success: result.success,
        },
      })
    }

    return og
  }

}
