import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AiImage from 'App/Models/AiImage'
import StableDiffusionCannyEdgeDetection from 'App/Services/Generators/StableDiffusionCannyEdgeDetection'
import StableDiffusionShapeDetection from 'App/Services/Generators/StableDiffusionShapeDetection'
import { generateOpepenPNG } from 'App/Services/OpepenSVG/OpepenGenerator'
import BaseController from './BaseController'

export default class AiImagesController extends BaseController {
  public async show ({ params }: HttpContextContract) {
    return AiImage.query()
      .preload('journeyStep', query => query.preload('journey'))
      .whereNotNull('journeyStepId')
      .where('uuid', params.id)
      .firstOrFail()
  }

  // TODO: Authenticate
  public async reseed({ params }: HttpContextContract) {
    const image = await AiImage.findByOrFail('uuid', params.id)

    const input = {
      prompt: image.data.prompt,
      base_image: await generateOpepenPNG(image.data.opepen),
    }

    // FIXME: Refactor
    const Generator = image.modelId === 4
      ? StableDiffusionCannyEdgeDetection
      : StableDiffusionShapeDetection

    return await (new Generator(input, image)).generate()
  }

  // TODO: Authenticate
  public async upscale({ params }: HttpContextContract) {
    const image = await AiImage.findByOrFail('uuid', params.id)

    await image.upscale()

    return image
  }

  public async delete({ params }: HttpContextContract) {
    const image = await AiImage.findByOrFail('uuid', params.id)

    image.journeyStepId = null

    await image.save()

    return { success: true }
  }
}
