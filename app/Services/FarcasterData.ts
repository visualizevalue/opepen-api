import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import Cast from 'App/Models/Cast'
import { Account } from 'App/Models'
import TimelineUpdate from 'App/Models/TimelineUpdate'
import { DateTime } from 'luxon'

const TIME_START = 1609455600

export class FarcasterData {
  HUB_HTTP_URL: string = `https://${Env.get('FARCASTER_HUB')}`
  NETWORK: number = 1

  public async importCasts (
    reverse: boolean = true,
    allPages: boolean = true,
    parentUrl: string = `chain://eip155:1/erc721:0x6339e5e072086621540d0362c4e3cea0d643e114`,
  ) {
    let query = `pageSize=100&reverse=&url=${parentUrl}`
    if (reverse) query += `&reverse=1`

    const url = `${this.HUB_HTTP_URL}/v1/castsByParent?${query}`

    try {
      let pageToken: string|null = null

      while (pageToken !== '') {
        const response = await axios.get(`${url}${pageToken ? `&pageToken=${pageToken}` : ``}`)
        pageToken = allPages ? response.data.nextPageToken : ''

        Logger.info(`Fetching casts page`)

        for (const message of response.data.messages) {
          if (message.data.type !== 'MESSAGE_TYPE_CAST_ADD') return

          const account = await this.getAccount(message.data.fid)

          let cast = await Cast.findBy('hash', message.hash)
          if (! cast) {
            cast = await Cast.create({
              ...message,
              address: account?.address,
              createdAt: DateTime.fromSeconds(TIME_START + message.data.timestamp).toISO(),
            })

            // Save timeline for initial creation
            await TimelineUpdate.createFor(cast)
          }
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  public async getFidOwner (fid: number): Promise<string|null> {
    const url = `https://fnames.farcaster.xyz/transfers?fid=${fid}`

    try {
      const response = await axios.get(url)

      const latestTransfer = response.data.transfers[response.data.transfers.length - 1]

      return latestTransfer.owner?.toLowerCase()
    } catch (e) {
      console.error(e)
    }

    return null
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

    // Fetch the verified addresses
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

    // Fetch the onchain owner of the FID.
    const owner = await this.getFidOwner(fid)
    if (owner) user.addresses.push(owner)

    return user
  }

  public async getAccount (fid: number): Promise<Account|null> {
    const existingAccount = await Account.query()
      .whereJsonSuperset('farcaster', { fid })
      .first()

    if (existingAccount) return existingAccount

    // Fetch/import account
    const user = await this.getUser(fid)

    if (! user?.addresses) return null

    let account = await Account.query()
      .whereIn('address', user.addresses)
      .withCount('opepen')
      .orderBy('opepen_count', 'desc')
      .first()

    if (! account) {
      account = await Account.create({ address: user.addresses[0] })
    }

    return account
  }
}

export default new FarcasterData()
