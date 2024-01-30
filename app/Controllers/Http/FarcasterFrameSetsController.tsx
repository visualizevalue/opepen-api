import React from 'react'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import pad from 'App/Helpers/pad'
import { SetModel } from 'App/Models'

import FarcasterFramesController from './FarcasterFramesController'

export default class FarcasterFrameSetsController extends FarcasterFramesController {

  protected entryTitle: string = 'Opepen Set Frame'
  protected entryImage: string = 'https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/sets.png'

  public async setsEntry (_: HttpContextContract) {
    return this.setOverview()
  }

  public async sets ({ request }: HttpContextContract) {
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    if (buttonIndex == 1) {
      // return response.redirect('https://opepen.art/sets')
    }

    return this.setResponse(1)
  }

  public async set ({ request, params }: HttpContextContract) {
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)
    const set = parseInt(params.id)
    const previous = buttonIndex === 1
    // const browse = buttonIndex === 2
    const next = buttonIndex === 2

    const toOverview = (next && set >= 200) || (previous && set <= 1)
    if (toOverview) return this.setOverview()

    const newSetId = next ? set + 1 : set - 1

    // if (browse) return response.redirect(`https://opepen.art/sets/${pad(newSetId, 3)}`)

    return this.setResponse(newSetId)
  }

  public async image ({ params, response }: HttpContextContract) {
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

    const png = await this.png(svg)

    await Drive.put(storeKey, png)

    return png
  }

  private setOverview () {
    return this.response({
      imageUrl: `https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/sets@frame.png`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets`,
      actions: [
        // { text: 'View Website', action: 'redirect' },
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
        // { text: `Browse Set #${pad(id, 3)}`, action: 'redirect' },
        id >= 200 ? '↺ Overview' : `Next →`,
      ]
    })
  }
}
