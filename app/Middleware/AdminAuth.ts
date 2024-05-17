import { SessionContract } from '@ioc:Adonis/Addons/Session'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export const AUTH_ADDRESSES = [
  '0xe11da9560b51f8918295edc5ab9c0a90e9ada20b',
  '0xc8f8e2f59dd95ff67c3d39109eca2e2a017d4c8a',
  '0x412c84b454ee700cb22d1a7d214eb5bad1ba19b4',
  '0x1d4c8282a408d8fe92496cccd1eaa4ff0fdd3b97',
  '0xed029061b6e3d873057eeefd3be91121e103ea44',
]

export const isAdminAddress = (address: string) => {
  if (AUTH_ADDRESSES.includes(address?.toLowerCase())) return true

  return false
}

export const isAdmin = (session: SessionContract) => {
  return isAdminAddress(session.get('siwe')?.address)
}

export default class AdminAuth {
  public async handle({ session, response }: HttpContextContract, next: () => Promise<void>) {
    if (! isAdmin(session)) return response.unauthorized({ error: 'Not authorized' })

    await next()
  }
}
