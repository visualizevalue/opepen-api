import fs from 'fs'
import React from 'react'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Application from '@ioc:Adonis/Core/Application'
import Drive from '@ioc:Adonis/Core/Drive'
import pad from 'App/Helpers/pad'
import BaseController from './BaseController'
import satori from 'satori'
import { SetModel } from 'App/Models'
import sharp from 'sharp'
import axios from 'axios'

const PREVIEW_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

export default class FarcasterFrameImagesController extends BaseController {

  public async set ({ params, response }: HttpContextContract) {
    const key = `og/sets/${params.id}.png`

    const pngBuffer = await Drive.exists(key)
      ? await Drive.get(key)
      : await this.makeSetPNG(params.id, key)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(pngBuffer))
      .send(pngBuffer)
  }

  private async makeSetPNG (setId, storeKey) {
    const set = await SetModel.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .where('id', setId)
      .firstOrFail()

    const svg = await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#101010',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          fontSize: 24,
          padding: '2rem',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
        }}>
          <img width="32px" height="32px" src={await this.urlAsBuffer('https://opepen.nyc3.cdn.digitaloceanspaces.com/opepen-icon-white.png')} />

          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto 0 0 0',
            padding: '0 2rem 0 0',
            justifyContent: 'flex-end',
          }}>
            <p style={{
              textTransform: 'uppercase',
              display: 'block',
              color: '#696969',
              margin: '0 0 0.5em',
              fontFamily: 'SpaceGrotesk-Bold',
            }}
            >Set {pad(set.id, 3)}</p>
            <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{set.name || 'Unrevealed'}</h1>
          </aside>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          width: '50%',
        }}>
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
            }}
            src={await this.urlAsBuffer(set.edition1Image?.staticURI)}
            width={141 * 2 + 10}
            height={141 * 2 + 10}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              left: 141 * 2 + 10 * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition4Image?.staticURI)}
            width="141"
            height="141"
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: 141 + 10 + 'px',
              left: 141 * 2 + 10 * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition5Image?.staticURI)}
            width="141"
            height="141"
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: 141 * 2 + 10 * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition10Image?.staticURI)}
            width="141"
            height="141"
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: 141 * 2 + 10 * 2 + 'px',
              left: 141 + 10 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition20Image?.staticURI)}
            width="141"
            height="141"
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: 141 * 2 + 10 * 2 + 'px',
              left: 141 * 2 + 10 * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition40Image?.staticURI)}
            width="141"
            height="141"
          />
        </div>
      </div>
    )

    // Generate PNG
    const png = await sharp(Buffer.from(svg))
      .toFormat('png')
      .toBuffer()

    await Drive.put(storeKey, png)

    return png
  }

  private async urlAsBuffer (url: string = 'https://opepenai.nyc3.cdn.digitaloceanspaces.com/images/base.png') {
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
      return PREVIEW_IMG
    }
  }

  private async svg (svg) {
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

}
