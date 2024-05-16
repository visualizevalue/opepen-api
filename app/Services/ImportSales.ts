import { paths } from '@reservoir0x/reservoir-kit-client'
import Env from '@ioc:Adonis/Core/Env'
import apiGenerator from 'api'
import { delay } from 'App/Helpers/time'
import Logger from '@ioc:Adonis/Core/Logger'
import Event from 'App/Models/Event'

// @ts-ignore
type Sale = paths['/sales/v4']['get']['responses']['200']['schema']['sales'][0]
const halfHour = 1000 * 60 * 60 / 2

const sdk = apiGenerator('@reservoirprotocol/v1.0#1llv231dlb6nmm72')
sdk.server(Env.get('RESERVOIR_BASE'))

export default class ImportSales {
  public startTimestamp: number;

  public async track () {
    while (true) {
      await this.sync()

      await delay(halfHour)
    }
  }

  public async sync () {
    await this.run(Env.get('OPEPEN_ADDRESS'))
  }

  public async run(contract: string) {
    sdk.auth(Env.get('RESERVOIR_KEY'))

    Logger.info(`Fetching historical sales for ${contract}`)

    const latestSale = await Event.query()
      .whereRaw('data->\'saleId\' is not null')
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
      let data = await this.fetchBatch(contract)
      sales = sales.concat(data.sales)
      while (data.continuation) {
        Logger.info(`Next page`)

        await delay(500)
        data = await this.fetchBatch(contract, data.continuation)
        sales = sales.concat(data.sales)
      }
    } catch (e) {
      console.log(e)
    }

    // Save Sales
    for (const sale of sales) {
      const event = await Event.query()
        .preload('opepen')
        .where('tokenId', parseInt(sale.token.tokenId))
        .where('transactionHash', sale.txHash.toLowerCase())
        .where(q => {
          q.where('to', sale.to.toLowerCase())
          q.orWhere('to', sale.from.toLowerCase())
          q.orWhere('from', sale.to.toLowerCase())
          q.orWhere('from', sale.from.toLowerCase())
        })
        .orderBy('logIndex', 'desc')
        .first()

      if (! event) {
        Logger.warn(`Event for sale ${sale.id} not found`)
      } else {
        event.value = sale.price.amount.raw
        event.data = sale
        await event.save()
        Logger.info(`Event for sale ${sale.id} saved`)

        // TODO: Maybe send notification...
      }
    }
  }

  private async fetchBatch (contract: string, continuation?: string) {
    const query: {
      contract: string,
      limit: string,
      accept: string,
      continuation?: string,
      startTimestamp?: number,
    } = {
      contract,
      limit: '100',
      accept: '*/*',
    }

    if (this.startTimestamp) {
      query.startTimestamp = this.startTimestamp
    }

    if (continuation) {
      query.continuation = continuation
    }

    const { data } = await sdk.getSalesV4(query)

    return data as paths['/sales/v4']['get']['responses']['200']['schema']
  }
}
