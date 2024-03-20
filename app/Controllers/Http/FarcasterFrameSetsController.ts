import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import { string } from '@ioc:Adonis/Core/Helpers'
import pad from 'App/Helpers/pad'

import FarcasterFramesController from './FarcasterFramesController'
import SetOverviewRenderer from 'App/Frames/SetOverviewRenderer'
import SetSubmission from 'App/Models/SetSubmission'

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
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `og/sets/${submission.uuid}_${submission.name ? string.toSlug(submission.name) : 'unrevealed'}.png`

    if (request.method() !== 'POST' && await Drive.exists(key)) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const image = await SetOverviewRenderer.render(submission)

    await this.saveImage(key, image)

    return this.imageResponse(image, response)
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
