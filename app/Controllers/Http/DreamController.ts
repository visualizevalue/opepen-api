import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import StableDiffusionEdgeDetection from 'App/Services/Generators/StableDiffusionEdgeDetection'
import StableDiffusionShapeDetection from 'App/Services/Generators/StableDiffusionShapeDetection'

export default class DreamController {
  public async handle({ request }: HttpContextContract) {
    const input = {
      base_image: request.input('base'),
      input_image: request.input('input_image'),
      prompt: request.input('prompt'),
    }

    const keepForm = request.input('form') === 'keep'
    const Generator = keepForm ? StableDiffusionEdgeDetection : StableDiffusionShapeDetection

    const image = await (new Generator(input)).generate()

    return image
  }
}
