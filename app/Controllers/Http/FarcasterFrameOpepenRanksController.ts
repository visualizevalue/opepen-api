import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import FarcasterFramesController from './FarcasterFramesController'
import SetSubmission from 'App/Models/SetSubmission'
import { takeRandom } from 'App/Helpers/arrays'
import Image from 'App/Models/Image'
import Farcaster from 'App/Services/Farcaster'
import OpePollRenderer from 'App/Frames/OpePollRenderer'

export default class FarcasterFrameOpepenRanksController extends FarcasterFramesController {
  public async entry(_: HttpContextContract) {
    return this.response({
      imageUrl: `https://opepen.nyc3.cdn.digitaloceanspaces.com/OG/ranks@frame.png`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/ranks/vote`,
      actions: ['Start Voting'],
    })
  }

  public async vote({ request }: HttpContextContract) {
    const { leftImage, rightImage } = await this.fetchImages(request)

    // If we don't have anything to evaluate, just render the new vote
    if (!leftImage || !rightImage) return this.renderNewVote()

    // Fetch user input
    const { untrustedData, trustedData } = request.body()

    // Verify user input
    if (!(await Farcaster.verifyMessage({ untrustedData, trustedData })))
      return this.renderNewVote()

    // Get user input
    const buttonIndex = parseInt(untrustedData.buttonIndex)
    const winner = buttonIndex == 1 ? leftImage : rightImage

    // Update our winner
    winner.points += 1
    await winner.save()

    // Render a new vote
    return this.renderNewVote()
  }

  public async image({ request, response }: HttpContextContract) {
    const { leftImage, rightImage } = await this.fetchImages(request)

    if (!leftImage || !rightImage) throw Error(`No image given`)

    // Ensure we have the images
    if (!leftImage.versions.sm) await leftImage.generateScaledVersions()
    if (!rightImage.versions.sm) await rightImage.generateScaledVersions()

    const png = await OpePollRenderer.render({ leftImage, rightImage })

    return this.imageResponse(png, response)
  }

  private async fetchImages(
    request,
  ): Promise<{ leftImage: Image | null; rightImage: Image | null }> {
    const query = request.qs()

    const { left, right } = query
    let leftImage, rightImage

    if (left && right) {
      ;[leftImage, rightImage] = await Promise.all([Image.find(left), Image.find(right)])
    }

    return {
      leftImage,
      rightImage,
    }
  }

  private async renderNewVote() {
    const [leftSubmission, rightSubmission] = await SetSubmission.query()
      .withScopes((scopes) => {
        scopes.complete()
        scopes.starred()
      })
      .orderByRaw('random()')
      .limit(2)

    const options = [1, 4, 5, 10, 20, 40]

    const leftEditionSize = takeRandom(options)
    const rightEditionSize = takeRandom(options)

    const leftId = leftSubmission[`edition_${leftEditionSize}ImageId`]
    const rightId = rightSubmission[`edition_${rightEditionSize}ImageId`]

    const leftName = leftSubmission[`edition_${leftEditionSize}Name`]
    const rightName = rightSubmission[`edition_${rightEditionSize}Name`]

    return this.response({
      imageUrl: `${Env.get('APP_URL')}/v1/frames/image/ranks/vote?left=${leftId}&right=${rightId}`,
      postUrl: `${Env.get('APP_URL')}/v1/frames/ranks/vote?left=${leftId}&right=${rightId}`,
      actions: [
        `♥ ${leftName}`, // » «
        `♥ ${rightName}`, // » «
      ],
    })
  }
}
