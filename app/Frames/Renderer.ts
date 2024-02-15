import fs from 'fs'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import Application from '@ioc:Adonis/Core/Application'

export type Action = string|{ text: string, action: 'post'|'post_redirect'|'link'|'mint', target?: string }
export type AspectRatio = '1.9:1'|'1:1'

export default class Renderer {

  static ASPECT_RATIOS = {
    SQUARE: {
      WIDTH: 1000,
      HEIGHT: 1000,
    },
    WIDE: {
      WIDTH: 955,
      HEIGHT: 500,
    },
  }
  static PADDING = 64

  protected static async svg (svg, ratio: 'SQUARE'|'WIDE' = 'WIDE') {
    return satori(
      svg,
      {
        width: this.ASPECT_RATIOS[ratio].WIDTH,
        height: this.ASPECT_RATIOS[ratio].HEIGHT,
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

  protected static async png (svg) {
    return await sharp(Buffer.from(svg))
      .toFormat('png')
      .toBuffer()
  }

  protected static async urlAsBuffer (url: string = 'https://opepenai.nyc3.cdn.digitaloceanspaces.com/images/base.png') {
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
