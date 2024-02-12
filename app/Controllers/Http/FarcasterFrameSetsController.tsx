import React from 'react'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import { string } from '@ioc:Adonis/Core/Helpers'
import pad from 'App/Helpers/pad'
import { SetModel } from 'App/Models'

import FarcasterFramesController from './FarcasterFramesController'

export default class FarcasterFrameSetsController extends FarcasterFramesController {

  public async setsEntry (_: HttpContextContract) {
    return this.setOverview()
  }

  public async sets ({ request, response }: HttpContextContract) {
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    // Hotfix for previous frame version
    const isSkipCastId = data.castId.hash === '0xed3fe8a753a425148b3eb1736629588e272444f9'

    if (buttonIndex == 1 && !isSkipCastId) {
      return response.redirect('https://opepen.art/sets')
    }

    return this.setResponse(1)
  }

  public async set ({ request, params, response }: HttpContextContract) {
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)
    const set = parseInt(params.id)
    const previous = buttonIndex === 1
    const browse = buttonIndex === 2
    const next = buttonIndex === 3

    if (browse) {
      return response.redirect(`https://opepen.art/sets/${pad(set, 3)}`)
    }

    const toOverview = (next && set >= 200) || (previous && set <= 1)
    if (toOverview) return this.setOverview()

    const newSetId = next ? set + 1 : set - 1
    return this.setResponse(newSetId)
  }

  public async image ({ request, params, response }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)
    const key = `og/sets/${set.id}_${set.name ? string.toSlug(set.name) : 'unrevealed'}.png`

    const pngBuffer = (request.method() !== 'POST' && await Drive.exists(key))
      ? await Drive.get(key)
      : await this.makeSetPNG(set, key)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(pngBuffer))
      .send(pngBuffer)
  }

  private async makeSetPNG (set: SetModel, storeKey) {
    await Promise.all([
      set.load('edition1Image'),
      set.load('edition4Image'),
      set.load('edition5Image'),
      set.load('edition10Image'),
      set.load('edition20Image'),
      set.load('edition40Image'),
    ])

    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.WIDE.HEIGHT - imagePadding * 2 - this.PADDING*2) / 3

    const svg = await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#101010',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          padding: '4rem',
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
          position: 'relative',
          left: this.ASPECT_RATIOS.WIDE.WIDTH/2 - imageWidth*3 - imagePadding*2 - this.PADDING + 'px',
        }}>
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
            }}
            src={await this.urlAsBuffer(set.edition1Image?.staticURI)}
            width={imageWidth * 2 + imagePadding}
            height={imageWidth * 2 + imagePadding}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition4Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth + imagePadding + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition5Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition10Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth + imagePadding + 'px',
            }}
            src={await this.urlAsBuffer(set.edition20Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition40Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
        </div>
      </div>
    )

    const png = await this.png(svg)

    await Drive.put(storeKey, png, {
      contentType: 'image/png',
    })

    return png
  }

  private setOverview () {
    return this.response({
      imageUrl: `https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/sets@frame.png`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets`,
      actions: [
        { text: 'View Website', action: 'post_redirect' },
        'Browse Sets',
      ],
    })
  }

  private setResponse (id) {
    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/image/sets/${id}`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}`,
      actions: [
        id <= 1 ? '← Overview' : `← Previous`,
        { text: `View Set #${pad(id, 3)}`, action: 'post_redirect' },
        id >= 200 ? '↺ Overview' : `Next →`,
      ]
    })
  }
}
