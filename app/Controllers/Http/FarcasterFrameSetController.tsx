import React from 'react'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import { string } from '@ioc:Adonis/Core/Helpers'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import pad from 'App/Helpers/pad'
import Account from 'App/Models/Account'
import Opepen from 'App/Models/Opepen'
import SetModel from 'App/Models/SetModel'
import Subscription from 'App/Models/Subscription'
import Farcaster from 'App/Services/Farcaster'
import FarcasterFramesController, { type Action } from './FarcasterFramesController'

export default class FarcasterFrameSetController extends FarcasterFramesController {

  EDITIONS = [1, 4, 5, 10, 20, 40]

  /**
   * The entry point to our frame
   */
  public async set ({ request, params }: HttpContextContract) {
    if (request.method() === 'GET') return this.setOverview(params.id)

    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    // Opt In
    if (buttonIndex == 1) {
      return this.optIn(arguments[0])
    }

    // View 1/1 Detail
    if (buttonIndex === 2) {
      return this.editionResponse(params.id, 1, data.fid)
    }

    // Initially, just show the overview
    return this.setOverview(params.id)
  }

  /**
   * The edition overview for our frame
   */
  public async edition ({ request, params }: HttpContextContract) {
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)

    // Opt In
    if (buttonIndex == 1) {
      return await this.optIn(arguments[0])
    }

    // Browse next
    const next = buttonIndex === 2

    // Cycle to overview
    const toOverview = next && params.edition == 40
    if (toOverview) return this.setOverview(params.id)

    // Go next
    if (next) return this.editionResponse(params.id, this.getNextEdition(params.edition), data.fid)

    // Default view current edition
    return this.editionResponse(params.id, params.edition, data.fid)
  }

  /**
   * Opt in to a set or an editioned image with all applicable unrevealed opepen
   */
  public async optIn({ request, params }: HttpContextContract) {
    // Fetch user input
    const { untrustedData, trustedData } = request.body()

    // Verify user input
    if (! await Farcaster.verifyMessage({ untrustedData, trustedData })) return this.setOverview(params.id)

    // Get Opepen
    const opepen = await this.getOwnedOpepen(untrustedData.fid, params.edition)
    if (! opepen.length) return this.optInResponse(opepen, params.id, params.edition)

    // Opt In
    const subscription = await Subscription.firstOrCreate({
      setId: params.id,
      address: opepen[0].owner,
    })

    subscription.message = JSON.stringify({untrustedData, trustedData})
    subscription.signature = 'farcaster'
    subscription.opepenIds = opepen.map(o => o.tokenId.toString())
    subscription.createdAt = DateTime.now()

    await subscription.save()

    return this.optInResponse(opepen, params.id, params.edition)
  }

  public async optInImage ({ request, params, response }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)
    const { opepen, edition } = request.qs()

    const count = parseInt(opepen)

    const imageUrl = edition
      ? `${Env.get('APP_URL')}/v1/frames/sets/${params.id}/detail/${edition}/image`
      : `${Env.get('APP_URL')}/v1/frames/sets/${params.id}/detail/image`

    const padding = 32*3
    const pngBuffer = await this.png(await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#101010',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 24,
        }}
      >
        <img src={await this.urlAsBuffer(imageUrl)} />
        <aside style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${padding}px ${padding}px`,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0 0 0',
          justifyContent: 'center',
          textAlign: 'center',
          alignItems: 'center',
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.69) 60%, rgba(0,0,0,0.5) 100%)',
        }}>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{count ? 'Success!' : 'No Opepen found.'}</h1>
          <p>
            You opted in {count} Opepen to set {pad(set.id, 3)} ({set.name}){ edition && ` Edition of ${edition}` }.
          </p>
          {
            ! count && <p style={{margin: '0'}}>Make sure you have your Ethereum address connected to your Farcaster account.</p>
          }
        </aside>
      </div>,
      'SQUARE'
    ))

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(pngBuffer))
      .send(pngBuffer)
  }

  public async editionImage ({ request, params, response }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)
    const key = `frames/sets/${set.id}_${set.name ? string.toSlug(set.name) : 'unrevealed'}_${params.edition}.png`

    const pngBuffer = (request.method() !== 'POST' && await Drive.exists(key))
      ? await Drive.get(key)
      : await this.makeEditionPNG(set, params.edition, key)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(pngBuffer))
      .send(pngBuffer)
  }

  public async entryImage ({ request, params, response }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)
    const key = `frames/sets/${set.id}_${set.name ? string.toSlug(set.name) : 'unrevealed'}_overview.png`

    const pngBuffer = (request.method() !== 'POST' && await Drive.exists(key))
      ? await Drive.get(key)
      : await this.makeSetPNG(set, key)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(pngBuffer))
      .send(pngBuffer)
  }

  private async getOwnedOpepen(fid: number, edition?: string) {
    // Get Farcaster user
    const fcUser = await Farcaster.getUser(fid)

    // Get opepen account(s)
    // @ts-ignore
    const accounts = await Account.query().whereIn('address', fcUser?.addresses)

    // Get Opepen
    const opepenQuery = Opepen.query()
      .whereIn('owner', accounts.map(a => a.address))
      .whereNull('revealedAt')

    if (edition) {
      opepenQuery.whereJsonSubset('data', { edition: parseInt(edition) })
    }

    return await opepenQuery
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

    const paddingY = 32
    const paddingX = paddingY*3
    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.SQUARE.WIDTH - imagePadding * 2 - paddingX*2) / 3

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
          padding: `${paddingY}px ${paddingX}px`,
        }}
      >
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          position: 'relative',
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

        <aside style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${paddingY}px ${paddingX}px`,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0 0 0',
          justifyContent: 'flex-end',
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.69) 0%, rgba(0,0,0,0) 100%)',
        }}>
          <p style={{
            textTransform: 'uppercase',
            display: 'block',
            color: '#696969',
            margin: '0 0 0.25em',
            fontFamily: 'SpaceGrotesk-Bold',
          }}
          >Set {pad(set.id, 3)}</p>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{set.name || 'Unrevealed'}</h1>
        </aside>
      </div>,
      'SQUARE'
    )

    const png = await this.png(svg)

    await Drive.put(storeKey, png, {
      contentType: 'image/png',
    })

    return png
  }

  private async makeEditionPNG (set: SetModel, edition: 1|4|5|10|20|40, storeKey) {
    await set.load(`edition${edition}Image`)
    const image = set[`edition${edition}Image`]

    const paddingY = 32
    const paddingX = paddingY*3
    const imageWidth = this.ASPECT_RATIOS.SQUARE.WIDTH - paddingX*2

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
          padding: `${paddingY}px ${paddingX}px`,
        }}
      >
        <img
          style={{
            border: '1px solid #363636',
            borderRadius: '4px 16px 16px 16px',
            width: '100%',
          }}
          src={await this.urlAsBuffer(image?.staticURI)}
          width={imageWidth}
          height={imageWidth}
        />

        <aside style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${paddingY}px ${paddingX}px`,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0 0 0',
          justifyContent: 'flex-end',
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.69) 0%, rgba(0,0,0,0) 100%)',
        }}>
          <p style={{
            textTransform: 'uppercase',
            display: 'block',
            color: '#696969',
            margin: '0 0 0.25em',
            fontFamily: 'SpaceGrotesk-Bold',
          }}
          >Set {pad(set.id, 3)} – Edition of { edition }</p>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{set[`edition_${edition}Name`] || 'Unnamed'}</h1>
        </aside>
      </div>,
      'SQUARE'
    )

    const png = await this.png(svg)

    await Drive.put(storeKey, png, {
      contentType: 'image/png',
    })

    return png
  }

  private getNextEdition (edition) {
    const editionIdx = this.EDITIONS.findIndex(e => e == edition)
    return this.EDITIONS[(editionIdx + 1) % 6]
  }

  private async setOverview (id) {
    const set = await SetModel.findOrFail(id)

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}/detail/image`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}/detail`,
      actions: [
        set.revealsAt > DateTime.now()
          ? 'Opt In'
          : { text: `Set #${pad(id, 3)} on Opepen.art`, action: 'link', target: `https://opepen.art/sets/${set}` },
        'View 1/1 →',
      ],
      imageRatio: '1:1',
    })
  }

  private async editionResponse (id, edition, fid: number) {
    const set = await SetModel.findOrFail(id)
    const opepen = await this.getOwnedOpepen(fid, edition)

    const nextEdition = this.getNextEdition(edition)
    const actions: Action[] = [
      set.revealsAt > DateTime.now()
          ? `${opepen?.length ? `${opepen.length}x ` : ''}Opt In 1/${edition}`
          : { text: `Set #${pad(id, 3)} on Opepen.art`, action: 'link', target: `https://opepen.art/sets/${set}` },
      nextEdition === 1 ? `↺ Overview` : `View 1/${nextEdition} →`,
    ]

    if (nextEdition === 1) {
      actions.push({ text: `Set #${pad(id, 3)}`, action: 'link', target: `https://opepen.art/sets/${id}` })
    }

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}/detail/${edition}/image`,
      imageRatio: '1:1',
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}/detail/${edition}`,
      actions
    })
  }

  private optInResponse (opepen: Opepen[], set, edition) {
    const imageParams = new URLSearchParams({ opepen: opepen.length.toString() })
    if (edition) imageParams.append('edition', edition)

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/sets/${set}/opt-in/image?${imageParams}`,
      imageRatio: '1:1',
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets/${set}/detail`,
      actions: [
        { text: `Set #${pad(set, 3)} on Opepen.art`, action: 'link', target: `https://opepen.art/sets/${set}` }
      ]
    })
  }
}
