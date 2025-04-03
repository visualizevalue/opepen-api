import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {
  generateOpepenConfig,
  generateOpepenPNG,
} from 'App/Services/OpepenSVG/OpepenGenerator'

export default class SVG2PNGController {
  public async handle({ request, response }: HttpContextContract) {
    const config = generateOpepenConfig(request.all())
    const image = await generateOpepenPNG(config)

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }
}
