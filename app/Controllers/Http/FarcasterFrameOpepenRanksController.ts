import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import FarcasterFramesController from './FarcasterFramesController'
import SetSubmission from 'App/Models/SetSubmission'
import { takeRandom } from 'App/Helpers/arrays'
import Image from 'App/Models/Image'

export default class FarcasterFrameOpepenRanksController extends FarcasterFramesController {

  protected entryTitle: string = 'Opepen Ranks'
  protected entryImage: string = 'https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/ranks@frame.png'

  public async entry (_: HttpContextContract) {
    return this.response({
      imageUrl: `https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/ranks@frame.png`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/ranks/vote`,
      actions: [
        'Start Voting',
      ],
    })
  }

  public async vote ({ request }: HttpContextContract) {
    const query = request.qs()

    const {left, right} = query

    // If we don't have anything to evaluate, just render the new vote
    if (! left || ! right) return this.renderNewVote()

    // Get our images
    const [leftImage, rightImage] = await Promise.all([
      Image.findOrFail(left),
      Image.findOrFail(right),
    ])

    // Fetch user input
    const data = request.body().untrustedData
    const buttonIndex = parseInt(data.buttonIndex)
    const winner = buttonIndex == 1 ? leftImage : rightImage

    // Update our winner
    winner.points += 1
    await winner.save()

    // Render a new vote
    return this.renderNewVote()
  }

  private async renderNewVote () {
    const [ leftSubmission, rightSubmission ] = await SetSubmission.query()
      .withScopes(scopes => scopes.complete())
      .orderByRaw('random()')
      .limit(2)

    const options = [1, 4, 5, 10, 20, 40]

    const leftEditionSize  = takeRandom(options)
    const rightEditionSize = takeRandom(options)

    const leftId  = leftSubmission[`edition_${leftEditionSize}ImageId`]
    const rightId = rightSubmission[`edition_${rightEditionSize}ImageId`]

    const leftName  = leftSubmission[`edition_${leftEditionSize}Name`]
    const rightName = rightSubmission[`edition_${rightEditionSize}Name`]

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/image/vote?left=${leftId}&right=${rightId}`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/ranks/vote?left=${leftId}&right=${rightId}`,
      actions: [
        `♥ ${leftName}`, // » «
        `♥ ${rightName}`, // » «
      ],
    })
  }

}
