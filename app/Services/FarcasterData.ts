import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import Cast from 'App/Models/Cast'

export class FarcasterData {
  HUB_HTTP_URL: string = `https://${Env.get('FARCASTER_HUB')}`
  NETWORK: number = 1

  public async importCasts (
    reverse: boolean = true,
    parentUrl: string = `chain://eip155:1/erc721:0x6339e5e072086621540d0362c4e3cea0d643e114`,
  ) {
    let query = `pageSize=100&reverse=&url=${parentUrl}`
    if (reverse) query += `&reverse=1`

    const url = `${this.HUB_HTTP_URL}/v1/castsByParent?${query}`

    try {
      let pageToken: string|null = null

      while (pageToken !== '') {
        const response = await axios.get(`${url}${pageToken ? `&pageToken=${pageToken}` : ``}`)
        pageToken = response.data.nextPageToken

        Logger.info(`Fetching casts page`)

        for (const message of response.data.messages) {
          if (message.data.type !== 'MESSAGE_TYPE_CAST_ADD') return

          await Cast.firstOrCreate({ hash: message.hash }, message)
        }
      }

    } catch (e) {
      console.error(e)
    }
  }

  public async getUser (fid: number) {
    const url = `${this.HUB_HTTP_URL}/v1/verificationsByFid?fid=${fid}&pageSize=1000`
    const user: {
      fid: number,
      addresses: string[]
    } = {
      fid,
      addresses: [],
    }

    try {
      const response = await axios.get(url)

      // TODO: Implement pagination
      for (const message of response.data.messages) {
        if (message.data.type !== 'MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS') return

        user.addresses.push(message.data.verificationAddEthAddressBody.address?.toLowerCase())
      }
    } catch (e) {
      console.error(e)
    }

    return user
  }
}

export default new FarcasterData()
