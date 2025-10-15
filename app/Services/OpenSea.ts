import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'

interface OpenSeaPrice {
  current: {
    currency: string
    decimals: number
    value: string
  }
}

interface OpenSeaProtocolData {
  parameters: {
    offerer: string
    offer: Array<{
      itemType: number
      token: string
      identifierOrCriteria: string
      startAmount: string
      endAmount: string
    }>
    consideration: any[]
  }
}

interface OpenSeaListing {
  order_hash: string
  chain: string
  type: string
  price: OpenSeaPrice
  protocol_data: OpenSeaProtocolData
  protocol_address: string
}

interface OpenSeaListingsResponse {
  listings: OpenSeaListing[]
  next?: string
}

export default class OpenSea {
  private static readonly CONTRACT_ADDRESS = '0x6339e5e072086621540d0362c4e3cea0d643e114'
  private static readonly COLLECTION_SLUG = 'opepen-edition'
  private static readonly CHAIN = 'ethereum'

  private static getApiKey(): string {
    return Env.get('OPENSEA_KEY')
  }

  private static getBaseUrl(): string {
    return Env.get('OPENSEA_BASE', 'https://api.opensea.io')
  }

  public static async updateMetadata(identifier: string) {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    try {
      const url = `${baseUrl}/api/v2/chain/${this.CHAIN}/contract/${this.CONTRACT_ADDRESS}/nfts/${identifier}/refresh`

      await axios.post(url, {}, {
        headers: {
          'X-API-KEY': apiKey,
        },
      })

      Logger.info(`OpenSea force update on #${identifier} ✔️`)
    } catch (e) {
      Logger.error(JSON.stringify(e, null, 45))
      Logger.warn(`OpenSea force update on #${identifier} failed!`)
    }
  }

  public static async getAllListings(): Promise<OpenSeaListing[]> {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()
    const allListings: OpenSeaListing[] = []
    let next: string | undefined

    try {
      do {
        const url = `${baseUrl}/api/v2/listings/collection/${this.COLLECTION_SLUG}/all`
        const params: any = { limit: 100 }

        if (next) {
          params.next = next
        }

        const response = await axios.get<OpenSeaListingsResponse>(url, {
          headers: {
            'X-API-KEY': apiKey,
          },
          params,
        })

        if (response.data.listings) {
          allListings.push(...response.data.listings)
        }

        next = response.data.next

        Logger.info(`Fetched ${response.data.listings?.length || 0} listings from OpenSea (total: ${allListings.length})`)
      } while (next)

      Logger.info(`Fetched all ${allListings.length} listings from OpenSea`)
      return allListings
    } catch (e) {
      Logger.error('Failed to fetch OpenSea listings')
      Logger.error(JSON.stringify(e, null, 2))
      throw e
    }
  }
}
