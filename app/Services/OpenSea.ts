import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import axios from 'axios'

export default class OpenSea {
  public static async updateMetadata(tokenId: string) {
    try {
      const url = `${Env.get('OPENSEA_BASE')}/api/v2/chain/ethereum/contract/0x6339e5e072086621540d0362c4e3cea0d643e114/nfts/${tokenId}/refresh`
      Logger.debug(`OpenSea URL: ${url}`)
      await axios.post(
        url,
        {
          headers: {
            'accept': '*/*',
            'x-api-key': Env.get('OPENSEA_KEY'),
          }
        }
      )
    } catch (e) {
      Logger.error(JSON.stringify(e, null, 4))
      Logger.warn(`Force update on #${tokenId} failed!`)
    }
  }
}
