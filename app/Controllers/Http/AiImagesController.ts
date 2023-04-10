import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AiImage from 'App/Models/AiImage'
import StableDiffusionShapeDetection, { StableDiffusionShapeDetectionInput } from 'App/Services/Generators/StableDiffusionShapeDetection'
import { generateOpepenPNG } from 'App/Services/OpepenSVG/OpepenGenerator'
import BaseController from './BaseController'

export default class AiImagesController extends BaseController {
  // TODO: Authenticate
  public async reseed({ params }: HttpContextContract) {
    const image = await AiImage.findByOrFail('uuid', params.id)

    const input: StableDiffusionShapeDetectionInput = {
      prompt: image.data.prompt,
      base_image: await generateOpepenPNG(image.data.opepen),
    }

    return await (new StableDiffusionShapeDetection(input, image)).generate()
  }
}
