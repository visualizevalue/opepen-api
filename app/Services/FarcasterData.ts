import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import Cast from 'App/Models/Cast'
import { Account } from 'App/Models'
import TimelineUpdate from 'App/Models/TimelineUpdate'
import { DateTime } from 'luxon'
import { isAdminAddress } from 'App/Middleware/AdminAuth'

const TIME_START = 1609455600

type FnameTransfer = {
  id: number,
  timestamp: number,
  username: string,
  owner: string,
  from: number,
  to: number,
  user_signature: string,
  server_signature: string,
}

export class FarcasterData {
  HUB_HTTP_URL: string = `https://${Env.get('FARCASTER_HUB')}`
  NETWORK: number = 1

  public async getOrImportCast (fid: string, hash: string) {
    const existing = await Cast.query()
      .where('hash', hash)
      .preload('account')
      .first()

    if (existing) return existing

    const { data: message } = await axios.get(`${this.HUB_HTTP_URL}/v1/castById?fid=${fid}&hash=${hash}`)

    const account = await this.getAccount(message.data.fid)

    return Cast.create({
      ...message,
      address: account?.address,
      createdAt: DateTime.fromSeconds(TIME_START + message.data.timestamp).toISO(),
      approvedAt: isAdminAddress(account?.address || '') ? DateTime.now() : null,
    })
  }

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
              approvedAt: isAdminAddress(account?.address || '') ? DateTime.now() : null,
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

  public async getFidOwner (fid: number): Promise<FnameTransfer|null> {
    const url = `https://fnames.farcaster.xyz/transfers?fid=${fid}`

    try {
      const response = await axios.get(url)

      const latestTransfer = response.data.transfers[response.data.transfers.length - 1]

      return latestTransfer
    } catch (e) {
      console.error(e)
    }

    return null
  }

  public async getUser (fid: number) {
    const url = `${this.HUB_HTTP_URL}/v1/verificationsByFid?fid=${fid}&pageSize=1000`
    const user: {
      fid: number,
      username: string,
      addresses: string[]
    } = {
      fid,
      username: '',
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
    const transfer = await this.getFidOwner(fid)
    if (transfer) {
      user.addresses.push(transfer.owner)
      user.username = transfer.username
    }

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

    // Save farcaster data to account
    account.farcaster = {
      fid,
      username: user.username,
    }
    await account.save()

    return account
  }
}

export default new FarcasterData()
