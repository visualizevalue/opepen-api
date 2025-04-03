import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Auth {
  public async handle({ session, response }: HttpContextContract, next: () => Promise<void>) {
    if (!session.get('siwe')) return response.unauthorized({ error: 'Not authorized' })

    await next()
  }
}
