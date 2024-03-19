import axios from 'axios'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import HandshakeAuction from 'App/Models/HandshakeAuction'

export default class AccountsController extends BaseController {

  public async list () {
    const auctions = await HandshakeAuction.query().orderBy('id', 'desc')

    const bidData = (await Promise.all(auctions.map(a => this.getBidData(a))))
      .map(b => ({
        highestBid: b.highestBid,
      }))

    return auctions.map((a, index) => ({...a.toJSON(), ...bidData[index]}))
  }

  public async show ({ params }: HttpContextContract) {
    const auction = await HandshakeAuction.query().where('slug', params.id).firstOrFail()

    const bidData = await this.getBidData(auction)

    return {
      ...auction.toJSON(),
      ...bidData,
    }
  }

  private async getBidData (auction: HandshakeAuction) {
    const { data: bids } = await axios.get(Env.get('SIGNATURE_API_BASE') + `/signatures`, {
      params: {
        'filters[schema]': auction.schemaId,
        'limit': '1000',
      }
    })

    const totalBids = bids.meta.total
    const earliestBid = bids.data[bids.data.length - 1]
    const latestBid = bids.data[0]

    const bidders = new Set(bids.data.map(b => b.signer))
    const bidderAccounts = await Account.query().preload('pfp').whereIn('address', Array.from(bidders) as string[])

    const parsedBids = bids.data
      .map(b => {
        return {
          account: bidderAccounts.find(a => a.address === b.signer),
          bidCount: parseInt(JSON.parse(b.object).Opepen.split(' ')[0]),
          id: b.id,
          createdAt: b.created_at,
          signature: b.signature,
          object: b.object,
        }
      })
      .sort((a, b) => {
        if (a.bidCount == b.bidCount) return a.created_at < b.createdAt ? 1 : -1
        if (a.bidCount > b.bidCount) return -1
        return 1
      })

    return {
      highestBid: parsedBids[0],
      bids: parsedBids,
      totalBids,
      earliestBid,
      latestBid,
    }
  }
}
