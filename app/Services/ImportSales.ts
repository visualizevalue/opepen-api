import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import { delay } from 'App/Helpers/time'
import Logger from '@ioc:Adonis/Core/Logger'
import Event from 'App/Models/Event'

type Sale = {
  chain: number
  contract: `0x${string}`
  token: string
  tx: `0x${string}`
  block: string
  timestamp: number
  logIndex: number
  from: `0x${string}`
  to: `0x${string}`
  amount: string
  price: {
    eth: string
    usd: string
    wei: string
  }
}

export default class ImportSales {
  public startTimestamp: number

  public async sync() {
    await this.run(Env.get('OPEPEN_ADDRESS'))
  }

  public async run(contract: string) {
    Logger.info(`Fetching historical sales for ${contract}`)

    const latestSale = await Event.query()
      .whereRaw("data->'price' is not null")
      .orderBy('blockNumber', 'desc')
      .orderBy('logIndex', 'desc')
      .first()
    if (latestSale && latestSale.data) {
      const saleData = latestSale.data as Sale
      this.startTimestamp = saleData.timestamp + 1
    }

    // Fetch Sales
    let sales: Sale[] = []
    try {
      let { data, meta } = await this.fetchBatch(contract, latestSale?.blockNumber)
      sales = sales.concat(data)

      while (meta.currentPage < meta.lastPage) {
        Logger.info(`Next page`)

        await delay(500)

        const response = await this.fetchBatch(
          contract,
          latestSale?.blockNumber,
          meta.currentPage + 1,
        )
        data = response.data
        meta = response.meta

        sales = sales.concat(data)
      }
    } catch (e) {
      console.log(e)
    }

    // Save Sales
    for (const sale of sales) {
      const event = await Event.query()
        .where('tokenId', parseInt(sale.token))
        .where('transactionHash', sale.tx.toLowerCase())
        .where((q) => {
          q.where('to', sale.to.toLowerCase())
          q.orWhere('to', sale.from.toLowerCase())
          q.orWhere('from', sale.to.toLowerCase())
          q.orWhere('from', sale.from.toLowerCase())
        })
        .orderBy('logIndex', 'desc')
        .first()

      if (!event) {
        Logger.warn(`Event for sale ${sale.token}:${sale.tx} not found`)
      } else {
        event.value = BigInt(sale.price.wei)
        event.data = { ...event.data, price: sale.price }
        await event.save()
        Logger.info(`Event for sale ${sale.token}:${sale.tx} saved`)

        // TODO: Maybe send notification...
      }
    }
  }

  private async fetchBatch(contract: string, fromBlock?: string, page?: number) {
    const params = new URLSearchParams()
    params.set('collection', contract)
    params.set('sortDirection', 'asc')
    params.set('fromBlock', fromBlock || '0')
    params.set('limit', '100')
    params.set('page', page?.toString() || '1')
    const url = `https://evm.api.vv.xyz/sales?${params}`

    console.log('fetching ', url)

    const { data } = await axios.get(url)

    return data as {
      data: Sale[]
      meta: {
        total: number
        perPage: number
        currentPage: number
        lastPage: number
      }
    }
  }
}
