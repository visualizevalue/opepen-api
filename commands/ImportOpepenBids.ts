import { BaseCommand } from '@adonisjs/core/build/standalone'
import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'
import { DateTime } from 'luxon'
import { delay } from 'App/Helpers/time'

export default class ImportOpepenBids extends BaseCommand {
  public static commandName = 'import:opepen_bids'
  public static description = 'Import bids from OpenSea API'
  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Bid } = await import('App/Models/Bid')
    const osKey = Env.get('OPENSEA_KEY')

    if (!osKey) {
      this.logger.error('OpenSea API key not configured')
      return
    }

    await Bid.query().delete()

    try {
      const collectionOffers = await this.fetchCollectionOffers(osKey)
      const allOffers = await this.fetchAllOffers(osKey)

      const totalProcessed = collectionOffers.processed + allOffers.processed
      const totalSaved = collectionOffers.saved + allOffers.saved

      this.logger.success(
        `Import complete! Processed ${totalProcessed} offers, saved ${totalSaved} bids (${collectionOffers.saved} collection offers, ${allOffers.saved} other offers)`,
      )

      // update set 076 image cache after importing bids
      try {
        await this.updateSet76ImageCache()
        this.logger.success('Image cache update for Set 076 complete!')
      } catch (cacheError) {
        this.logger.warning(`Image cache update for Set 076 failed: ${cacheError.message}`)
      }
    } catch (error) {
      this.logger.error(`Import failed: ${error.message}`)
      if (error.response?.status === 429) {
        this.logger.error('Rate limited. Try again later.')
      }
    }
  }

  private async fetchCollectionOffers(apiKey: string) {
    let cursor = null
    let pageCount = 0
    let totalProcessed = 0
    let totalSaved = 0

    do {
      pageCount++

      let url = 'https://api.opensea.io/v2/offers/collection/opepen-edition?limit=100'
      if (cursor) {
        url += `&next=${cursor}`
      }

      const response = await axios.get(url, {
        headers: { 'X-API-KEY': apiKey },
        timeout: 30000,
      })

      const { offers, next } = response.data
      cursor = next

      for (const offer of offers) {
        totalProcessed++

        try {
          const tokenIds = this.extractTokenIds(offer)
          const saved = await this.processOffer(offer, tokenIds)
          if (saved) totalSaved++
        } catch (error) {
          this.logger.error(`Error processing collection offer: ${error.message}`)
        }
      }

      if (cursor) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } while (cursor)

    return { processed: totalProcessed, saved: totalSaved }
  }

  private async fetchAllOffers(apiKey: string) {
    let cursor = null
    let pageCount = 0
    let totalProcessed = 0
    let totalSaved = 0

    do {
      pageCount++

      let url = 'https://api.opensea.io/v2/offers/collection/opepen-edition/all?limit=100'
      if (cursor) {
        url += `&next=${cursor}`
      }

      const response = await axios.get(url, {
        headers: { 'X-API-KEY': apiKey },
        timeout: 30000,
      })

      const { offers, next } = response.data
      cursor = next

      for (const offer of offers) {
        totalProcessed++

        try {
          const tokenIds = this.extractTokenIds(offer)
          const saved = await this.processOffer(offer, tokenIds)
          if (saved) totalSaved++
        } catch (error) {
          this.logger.error(`Error processing offer: ${error.message}`)
        }
      }

      if (cursor) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    } while (cursor)

    return { processed: totalProcessed, saved: totalSaved }
  }

  private extractTokenIds(offer: any): number[] | null {
    // handle trait-based offers (have criteria)
    if (offer.criteria?.encoded_token_ids) {
      const tokenIdsArray: number[] = offer.criteria.encoded_token_ids
        .split(',')
        .map((id: string) => parseInt(id.trim()))
        .filter((id: number) => !isNaN(id))

      return tokenIdsArray.length > 0 ? tokenIdsArray : null
    }

    // handle token-specific offers (from consideration items)
    const consideration = offer.protocol_data?.parameters?.consideration
    if (consideration) {
      for (const item of consideration) {
        if (
          (item.itemType === 2 || item.itemType === 3 || item.itemType === 4) &&
          item.identifierOrCriteria &&
          item.identifierOrCriteria !== '0' &&
          item.token === '0x6339e5e072086621540d0362c4e3cea0d643e114'
        ) {
          if (
            typeof item.identifierOrCriteria === 'string' &&
            !item.identifierOrCriteria.includes('[') &&
            !item.identifierOrCriteria.includes(',')
          ) {
            const tokenIdNumber = parseInt(item.identifierOrCriteria)
            if (!isNaN(tokenIdNumber) && tokenIdNumber > 0 && tokenIdNumber < 16000) {
              return [tokenIdNumber]
            }
          }
          break
        }
      }
    }

    return null
  }

  private async processOffer(offer: any, tokenIds: number[] | null): Promise<boolean> {
    const { default: Bid } = await import('App/Models/Bid')

    const orderHash = offer.order_hash
    const bidder = offer.protocol_data?.parameters?.offerer
    const amount = offer.price?.value
    const currency = offer.price?.currency

    const consideration = offer.protocol_data?.parameters?.consideration
    const tokenAmount =
      consideration && consideration[0]?.startAmount
        ? parseInt(consideration[0].startAmount)
        : null

    const startTime = offer.protocol_data?.parameters?.startTime
      ? DateTime.fromSeconds(parseInt(offer.protocol_data.parameters.startTime))
      : undefined
    const endTime = offer.protocol_data?.parameters?.endTime
      ? DateTime.fromSeconds(parseInt(offer.protocol_data.parameters.endTime))
      : undefined

    if (!orderHash || !bidder || !amount) {
      return false
    }

    if (endTime && endTime < DateTime.now()) {
      return false
    }

    const existingBid = await Bid.query().where('orderHash', orderHash).first()
    if (existingBid) {
      return false
    }

    await Bid.create({
      orderHash,
      bidder,
      amount: BigInt(amount),
      currency,
      tokenIds,
      tokenAmount,
      startTime,
      endTime,
    })

    return true
  }

  private async updateSet76ImageCache() {
    const { default: Opepen } = await import('App/Models/Opepen')

    const set76Tokens = await Opepen.query().where('setId', 76)

    for (const opepen of set76Tokens) {
      try {
        await opepen.updateImage()
        await delay(200)
      } catch (error) {
        this.logger.warning(
          `Failed to update cache for token ${opepen.tokenId}: ${error.message}`,
        )
      }
    }
  }
}
