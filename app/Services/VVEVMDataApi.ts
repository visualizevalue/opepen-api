import axios from 'axios'
import Logger from '@ioc:Adonis/Core/Logger'

export default class VVEVMDataApi {
  public static async updateMetadata(tokenId: string) {
    try {
      await axios.post(
        `https://evm.api.vv.xyz/metadata/1/0x6339e5E072086621540D0362C4e3Cea0d643E114/${tokenId}`,
      )

      Logger.info(`EVM Data API force update on #${tokenId} ✔️`)
    } catch (e) {
      Logger.error(JSON.stringify(e, null, 45))
      Logger.warn(`EVM Data API force update on #${tokenId} failed!`)
    }
  }
}
