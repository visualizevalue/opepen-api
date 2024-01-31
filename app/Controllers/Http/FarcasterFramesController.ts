import fs from 'fs'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import Application from '@ioc:Adonis/Core/Application'

type Action = string|{text:string, action:'post'|'post_redirect'}

export default class FarcasterFramesController {

  protected entryTitle: string = 'Opepen'
  protected entryImage: string = 'https://opepen.art/og/rare.png'

  protected response (
    {
      imageUrl,
      postUrl,
      actions,
    }: {
      imageUrl: string,
      postUrl: string,
      actions?: Action[],
    })
  {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${this.entryTitle}</title>
          <meta property="og:title" content="${this.entryTitle}">
          <meta property="og:image" content="${this.entryImage}">

          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${imageUrl}" />
          ${
            actions
              ?.map(
                (a, i) => typeof a === 'string'
                  ? `<meta property="fc:frame:button:${i + 1}" content="${a}" />`
                  : `
                    <meta property="fc:frame:button:${i + 1}" content="${a.text}" />
                    <meta property="fc:frame:button:${i + 1}:action" content="${a.action}" />
                  `
              ).join('')
          }
          <meta property="fc:frame:post_url" content="${postUrl}" />
        </head>
      </html>
    `
  }

  protected async svg (svg) {
    return satori(
      svg,
      {
        width: 955,
        height: 500,
        fonts: [
          {
            name: 'SpaceGrotesk-Medium',
            data: fs.readFileSync(Application.resourcesPath(`fonts/SpaceGrotesk-Medium.ttf`)),
            weight: 500,
            style: 'normal',
          },
          {
            name: 'SpaceGrotesk-Bold',
            data: fs.readFileSync(Application.resourcesPath(`fonts/SpaceGrotesk-Bold.ttf`)),
            weight: 700,
            style: 'normal',
          },
        ],
      }
    )
  }

  protected async png (svg) {
    return await sharp(Buffer.from(svg))
      .toFormat('png')
      .toBuffer()
  }

  protected async urlAsBuffer (url: string = 'https://opepenai.nyc3.cdn.digitaloceanspaces.com/images/base.png') {
    try {
      const response = await axios.get(url,  { responseType: 'arraybuffer' })

      let contentType = response.headers['content-type']
      let buffer = Buffer.from(response.data, 'utf-8')

      if (! ['image/png', 'image/jpeg'].includes(contentType)) {
        buffer = await sharp(buffer).toFormat('png').toBuffer()
        contentType = 'image/png'
      }

      return `data:${contentType};base64,${buffer.toString('base64')}`
    } catch (e) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  }

}
