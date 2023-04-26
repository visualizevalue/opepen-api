import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Journey from 'App/Models/Journey'
import JourneyStep from 'App/Models/JourneyStep'
import StableDiffusionCannyEdgeDetection from 'App/Services/Generators/StableDiffusionCannyEdgeDetection'
import StableDiffusionShapeDetection from 'App/Services/Generators/StableDiffusionShapeDetection'
import { generateOpepenConfig, generateOpepenPNG } from 'App/Services/OpepenSVG/OpepenGenerator'
import BaseController from './BaseController'

export default class JourneyStepsController extends BaseController {
  // TODO: Authenticate
  public async forJourney({ params, request }: HttpContextContract) {
    const journey = await Journey.findByOrFail('uuid', params.id)
    const {
      page = 1,
      limit = 24,
      filter = {},
    } = request.qs()

    const query = journey.related('steps').query()
      .preload('aiImages', query => {
        query.preload('image')
        query.orderBy('created_at')
      })

    this.applyFilters(query, filter)

    query.orderBy('created_at', 'desc')

    return query.paginate(page, limit)
  }

  // TODO: Authenticate
  public async store({ params, request }: HttpContextContract) {
    // Get the journey
    const journey = await Journey.findByOrFail('uuid', params.id)

    // Create the new step
    return journey.related('steps').create({
      prompt: request.input('prompt'),
      config: request.input('config'),
    })
  }

  // TODO: Authenticate
  public async dream({ params }: HttpContextContract) {
    const step = await JourneyStep.findByOrFail('uuid', params.id)

    const baseConfig = await generateOpepenConfig(step.config.opepen || {})

    const input = {
      prompt: step.prompt,
      base_image: await generateOpepenPNG(baseConfig),
    }

    const Generator = Math.random() > 0.5
      ? StableDiffusionCannyEdgeDetection
      : StableDiffusionShapeDetection

    const aiImage = await (new Generator(input)).generate()
    aiImage.journeyStepId = step.id
    aiImage.data.opepen = baseConfig
    await aiImage.save()

    // Sideload image
    await aiImage.load('image')

    return aiImage
  }
}
