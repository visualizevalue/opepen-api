import axios from 'axios'
import ogs from 'open-graph-scraper'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import OpenGraphUrl from 'App/Models/OpenGraphUrl'
import InvalidInput from 'App/Exceptions/InvalidInput'

const isImageMime = (mime) =>
  ['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(mime)

export default class OpenGraphController extends BaseController {
  public async show({ request }: HttpContextContract) {
    const { url } = request.qs()
    let og = await OpenGraphUrl.findBy('url', url)

    if (!og) {
      og = await this.make(url)
    }

    return og
  }

  private async make(url: string) {
    const og = new OpenGraphUrl()
    og.url = url

    try {
      const response = await axios(url)
      const isImage = isImageMime(response.headers['content-type'])
      const isHtml = response.headers['content-type'].includes('text/html')

      if (!isImage && !isHtml) throw new InvalidInput()

      if (isImage) {
        og.image = url
      } else {
        const { result } = await ogs({ html: response.data })
        og.title = result.ogTitle || ''
        og.description = result.ogDescription || ''
        og.image = result.ogImage?.length ? result.ogImage[0].url : ''

        og.data = {
          type: result.ogType,
          images: result.ogImage,
          favicon: result.favicon,
          charset: result.charset,
          success: result.success,
        }
      }

      await og.save()
    } catch (e) {
      // ...
    }

    return og
  }
}
