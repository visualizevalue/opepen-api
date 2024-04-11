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
import SetOptInRenderer from 'App/Frames/SetOptInRenderer'
import SetEditionRenderer from 'App/Frames/SetEditionRenderer'
import SetDetailRenderer from 'App/Frames/SetDetailRenderer'
import SetSubmission from 'App/Models/SetSubmission'
import SetOptStatusRenderer from 'App/Frames/SetOptStatusRenderer'

export default class FarcasterFrameSetController extends FarcasterFramesController {

  EDITIONS = [1, 4, 5, 10, 20, 40]

  /**
   * The entry point to our frame
   */
  public async set ({ request, params }: HttpContextContract) {
    if (request.method() === 'GET') return this.setOverviewResponse(params.id)

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
    return this.setOverviewResponse(params.id)
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
    if (toOverview) return this.setOverviewResponse(params.id)

    // Go next
    if (next) return this.editionResponse(params.id, this.getNextEdition(params.edition), data.fid)

    // Default view current edition
    return this.editionResponse(params.id, params.edition, data.fid)
  }

  public async optInStatus({ response, params }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    return this.imageResponse(
      await SetOptStatusRenderer.render({ submission }),
      response
    )
  }

  /**
   * Opt in to a set or an editioned image with all applicable unrevealed opepen
   */
  public async optIn({ request, params }: HttpContextContract) {
    // Check if set still live
    // TODO: Rework since we don't know the set yet...
    const set = await SetModel.findOrFail(params.id)
    await set.load('submission')
    if (set.submission.optInOpen()) return this.setOverviewResponse(params.id)

    // Fetch user input
    const { untrustedData, trustedData } = request.body()

    // Verify user input
    if (! await Farcaster.verifyMessage({ untrustedData, trustedData })) return this.setOverviewResponse(params.id)

    // Get Opepen
    const opepen = await this.getOwnedOpepen(untrustedData.fid, params.edition)
    if (! opepen.length) return this.optInResponse(opepen, params.id, params.edition)

    // Opt In
    const subscription = await Subscription.firstOrCreate({
      submissionId: set.submissionId,
      address: opepen[0].owner,
    })

    // Update FC subscription data
    subscription.signature = 'farcaster' // Signature has max length as it expects and eth signature
    subscription.message = JSON.stringify({untrustedData, trustedData})
    subscription.opepenIds = opepen.map(o => o.tokenId.toString())
    subscription.createdAt = DateTime.now()

    await subscription.save()

    return this.optInResponse(opepen, params.id, params.edition)
  }

  public async optInImage ({ request, params, response }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)
    const { opepen, edition } = request.qs()

    const count = parseInt(opepen)

    return this.imageResponse(
      await SetOptInRenderer.render({
        set,
        edition,
        count,
      }),
      response
    )
  }

  public async editionImage ({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `frames/submissions/${submission.uuid}_${submission.name ? string.toSlug(submission.name) : 'unrevealed'}_${params.edition}.png`

    if (request.method() !== 'POST' && await Drive.exists(key)) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const png = await SetEditionRenderer.render({ submission, edition: params.edition })

    await this.saveImage(key, png)

    return this.imageResponse(png, response)
  }

  public async entryImage ({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `/submissions/${submission.uuid}-${submission.setId || 'unrevealed'}_${string.toSlug(submission.name || 'unrevealed')}_overview.png`

    if (request.method() !== 'POST' && await Drive.exists(key)) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const png = await SetDetailRenderer.render(submission)

    await this.saveImage(key, png)

    return this.imageResponse(png, response)
  }

  private getNextEdition (edition) {
    const editionIdx = this.EDITIONS.findIndex(e => e == edition)
    return this.EDITIONS[(editionIdx + 1) % 6]
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

  private async setOverviewResponse (id) {
    const set = await SetModel.findOrFail(id)
    await set.load('submission')

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/render/sets/${id}/square`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/sets/${id}/detail`,
      actions: [
        set.submission.optInOpen()
          ? 'Opt In'
          : { text: `Set #${pad(id, 3)} on Opepen.art`, action: 'link', target: `https://opepen.art/sets/${set.id}` },
        'View 1/1 →',
      ],
      imageRatio: '1:1',
    })
  }

  private async editionResponse (id, edition, fid: number) {
    const set = await SetModel.findOrFail(id)
    await set.load('submission')
    const opepen = await this.getOwnedOpepen(fid, edition)

    const nextEdition = this.getNextEdition(edition)
    const actions: Action[] = [
      set.submission.optInOpen()
          ? `${opepen?.length ? `${opepen.length}x ` : ''}Opt In 1/${edition}`
          : { text: `Set #${pad(id, 3)} on Opepen.art`, action: 'link', target: `https://opepen.art/sets/${set.id}` },
      nextEdition === 1 ? `↺ Overview` : `View 1/${nextEdition} →`,
    ]

    if (nextEdition === 1) {
      actions.push({ text: `Set #${pad(id, 3)}`, action: 'link', target: `https://opepen.art/sets/${id}` })
    }

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/render/sets/${id}/${edition}/square`,
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
