import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { generateOpepenPNG } from 'App/Services/OpepenSVG/OpepenGenerator'

export default class SVG2PNGController {
  public async handle({ request, response }: HttpContextContract) {
    const image = await generateOpepenPNG({
      noise: request.input('noise', false),
      fill: request.input('fill'),
      stroke: request.input('stroke', 1),
      blur: request.input('blur', false),
      leftEye: request.input('leftEye', 1),
      rightEye: request.input('rightEye', 1),
      mouth: request.input('mouth'),
      torso: request.input('torso'),
      bg: request.input('bg'),
    })

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }
}
