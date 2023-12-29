import api from 'api'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'

const sdk = api('@opensea/v2.0#acj27lqhfpwaj')
sdk.auth(Env.get('OPENSEA_KEY'));
sdk.server(Env.get('OPENSEA_BASE'));

export default class OpenSea {
  public static async updateMetadata(identifier: string) {
    try {
      await sdk.refresh_nft({
        chain: 'ethereum',
        address: '0x6339e5e072086621540d0362c4e3cea0d643e114',
        identifier,
      })

      Logger.info(`OpenSea force update on #${identifier} ✔️`)
    } catch (e) {
      Logger.error(JSON.stringify(e, null, 45))
      Logger.warn(`OpenSea force update on #${identifier} failed!`)
    }
  }
}
