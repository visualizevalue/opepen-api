import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Bid from 'App/Models/Bid'
import Opepen from 'App/Models/Opepen'
import { DateTime } from 'luxon'

export default class BidsController {
  public async highestOffers({ params, request }: HttpContextContract) {
    const setId = parseInt(params.id)
    const address = request.input('address')?.toLowerCase()

    const opepen = await Opepen.query().where('setId', setId).exec()

    const editionTokenIds: Record<string, number[]> = {}
    for (const op of opepen) {
      const edition = op.data.edition.toString()
      if (!editionTokenIds[edition]) {
        editionTokenIds[edition] = []
      }
      editionTokenIds[edition].push(parseInt(op.tokenId.toString()))
    }

    let bidsQuery = Bid.query().where((builder) => {
      builder.whereNull('endTime').orWhere('endTime', '>', DateTime.now().toISO())
    })

    if (address) {
      bidsQuery = bidsQuery.where('bidder', address)
    }

    const allBids = await bidsQuery.exec()

    let highestCollectionOffer: bigint = 0n
    for (const bid of allBids) {
      if (bid.amount && bid.tokenIds === null) {
        const bidAmount = BigInt(bid.amount.toString())
        const perTokenPrice = bid.tokenAmount ? bidAmount / BigInt(bid.tokenAmount) : bidAmount
        if (perTokenPrice > highestCollectionOffer) {
          highestCollectionOffer = perTokenPrice
        }
      }
    }

    const result: Record<string, any> = {}

    for (const [edition, tokenIds] of Object.entries(editionTokenIds)) {
      let highestBid: bigint = 0n

      for (const bid of allBids) {
        if (!bid.amount || bid.tokenIds === null) continue

        let bidTokenIds: number[] = []
        if (Array.isArray(bid.tokenIds)) {
          bidTokenIds = bid.tokenIds
        } else if (typeof bid.tokenIds === 'number') {
          bidTokenIds = [bid.tokenIds]
        } else {
          continue
        }

        const bidTargetsThisEdition = bidTokenIds.some((bidTokenId) =>
          tokenIds.includes(bidTokenId),
        )

        if (bidTargetsThisEdition) {
          const bidAmount = BigInt(bid.amount.toString())
          const perTokenPrice = bid.tokenAmount
            ? bidAmount / BigInt(bid.tokenAmount)
            : bidAmount

          if (perTokenPrice > highestBid) {
            highestBid = perTokenPrice
          }
        }
      }

      if (highestBid > 0n) {
        result[edition] = highestBid.toString()
      } else if (highestCollectionOffer > 0n) {
        result[edition] = highestCollectionOffer.toString()
      } else {
        result[edition] = null
      }
    }

    return result
  }
}
