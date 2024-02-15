import Drive from '@ioc:Adonis/Core/Drive'
import { ResponseContract } from '@ioc:Adonis/Core/Response'

export type Action = string|{ text: string, action: 'post'|'post_redirect'|'link'|'mint', target?: string }
export type AspectRatio = '1.9:1'|'1:1'

export default class FarcasterFramesController {

  protected response (
    {
      title,
      imageUrl,
      imageRatio,
      postUrl,
      actions,
    }: {
      title?: string,
      imageUrl: string,
      imageRatio?: AspectRatio,
      postUrl: string,
      actions?: Action[],
    })
  {
    const txt = title || 'Opepen Frame'
    const ratio: AspectRatio = imageRatio || '1.9:1'

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${txt}</title>
          <meta property="og:title" content="${txt}">
          <meta property="og:image" content="${imageUrl}">

          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          <meta property="fc:frame:image:aspect_ratio" content="${ratio}" />
          ${
            actions
              ?.map(
                (a, i) => typeof a === 'string'
                  ? `<meta property="fc:frame:button:${i + 1}" content="${a}" />`
                  : `
                    <meta property="fc:frame:button:${i + 1}" content="${a.text}" />
                    <meta property="fc:frame:button:${i + 1}:action" content="${a.action}" />
                    ${
                      a.target ? `<meta property="fc:frame:button:${i + 1}:target" content="${a.target}" />` : ``
                    }
                  `
              ).join('')
          }
          <meta property="fc:frame:post_url" content="${postUrl}" />
        </head>
      </html>
    `
  }

  protected imageResponse (image: Buffer, response: ResponseContract) {
    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  protected saveImage (key, png) {
    return Drive.put(key, png, {
      contentType: 'image/png',
    })
  }

}
