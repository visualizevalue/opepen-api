import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class TokenUpdatesController {
  public async ping({ request, response }: HttpContextContract) {

    console.log(request)
  }
}
