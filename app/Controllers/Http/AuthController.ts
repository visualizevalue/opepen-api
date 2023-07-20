import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { SiweMessage, generateNonce } from 'siwe'

export default class AuthController {

  public async nonce ({ session }: HttpContextContract) {
    if (session.has('nonce')) {
      return {
        nonce: session.get('nonce')
      }
    }

    const nonce = generateNonce()

    session.put('nonce', nonce)

    return { nonce }
  }

  public async verify ({ session, request, response }: HttpContextContract) {
    if (! session.has('nonce')) return response.unauthorized('No valid session')

    const message = request.input('message')
    const signature = request.input('signature')

    const nonce = session.get('nonce')

    const siweMessage = new SiweMessage(message)
    let siwe
    try {
      siwe = await siweMessage.verify({ signature, nonce })
    } catch (e) {
      return response.unauthorized('Invalid session')
    }
    session.put('siwe', siwe.data)

    return siwe.data
  }

  public async me ({ session, response }: HttpContextContract) {
    if (! session.has('siwe')) return response.unauthorized('No valid session')

    return session.get('siwe')
  }

  public async clear ({ session, response }: HttpContextContract) {
    session.clear()

    return response.ok('Session cleared')
  }

}
