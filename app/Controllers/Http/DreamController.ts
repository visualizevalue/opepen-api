import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StableDiffusionEdgeDetection from 'App/Services/Generators/StableDiffusionEdgeDetection'

export default class DreamController {
  public async handle({ request }: HttpContextContract) {
    const image = await (new StableDiffusionEdgeDetection({
      base_image: request.input('base'),
      prompt: request.input('prompt'),
    })).generate()

    return image
  }
}
