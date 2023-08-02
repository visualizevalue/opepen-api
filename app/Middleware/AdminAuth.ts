import { SessionContract } from '@ioc:Adonis/Addons/Session'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export const AUTH_ADDRESSES = [
  '0xe11da9560b51f8918295edc5ab9c0a90e9ada20b',
  '0xc8f8e2f59dd95ff67c3d39109eca2e2a017d4c8a',
  '0x412c84b454ee700cb22d1a7d214eb5bad1ba19b4',
]

export const isAdmin = (session: SessionContract) => {
  const address = session.get('siwe')?.address?.toLowerCase()

  if (AUTH_ADDRESSES.includes(address)) return true

  return false
}

export default class AdminAuth {
  public async handle({ session, response }: HttpContextContract, next: () => Promise<void>) {
    if (! isAdmin(session)) return response.unauthorized({ error: 'Not authorized' })

    await next()
  }
}
