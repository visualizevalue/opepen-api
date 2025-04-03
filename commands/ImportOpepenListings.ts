import { BaseCommand } from '@adonisjs/core/build/standalone'
import reservoir from 'App/Services/Reservoir'

// FIXME: Fix TS build
// import { path } from '@reservoir0x/reservoir-sdk'
// type OrdersResponse = paths['/orders/asks/v5']['get']['responses']['200']['schema']['orders']

export default class ImportOpepenListings extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'import:opepen_listings'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    // Clear old olders
    const outdated = await Opepen.query().whereNotNull('price')
    const outdatedTokenIds = outdated.map((o) => o.tokenId.toString())
    for (const o of outdated) {
      o.price = null
      delete o.data.order

      await o.save()
    }
    this.logger.info(`Cleared out ${outdated.length} old orders`)

    // Fetch current orders
    const orders = await this.fetchOrders()
    const distinctTokens = new Set(orders.map((o) => o.criteria?.data?.token?.tokenId))

    // Keep track of opepen to update
    const opepenToUpdate: any[] = []

    // Save our order data
    for (const order of orders) {
      const tokenId = order.criteria?.data?.token?.tokenId

      const opepen = await Opepen.find(tokenId)
      if (!opepen || opepen.price) continue

      if (order.price?.currency?.symbol !== 'ETH') continue
      opepen.price = BigInt(order.price.amount?.raw || '0')

      opepen.data.order = {
        source: order.source?.domain as string,
        price: {
          raw: opepen.price.toString(),
          decimal: order.price.amount?.decimal || 0,
          usd: order.price.amount?.usd || 0,
        },
      }

      await opepen.save()

      // If we're a new listing, we might want to repull images or the like
      if (!outdatedTokenIds.includes(tokenId)) opepenToUpdate.push(opepen)
    }

    // Maybe update opepen w special rules
    await this.updateOpepenWithMarketDynamics(opepenToUpdate)

    this.logger.info(
      `Imported ${orders.length} new orders (for ${distinctTokens.size} Opepen)`,
    )
  }

  private async fetchOrders() {
    const data = await this.makeRequest()
    let orders = data.orders
    let continuation = data.continuation

    if (!orders) return []

    while (continuation) {
      const data = await this.makeRequest(continuation)
      orders = orders.concat(data.orders)
      continuation = data.continuation
    }

    this.logger.info(`${orders.length} Opepen Orders found`)

    return orders
  }

  private async makeRequest(continuation?: string) {
    const listings = await reservoir.getOrdersAsksV5({
      contracts: '0x6339e5E072086621540D0362C4e3Cea0d643E114',
      sortBy: 'price',
      continuation,
      limit: '1000',
      accept: '*/*',
    })

    this.logger.info(`Fetched orders (paginated)`)

    return listings?.data
  }

  // Update Opepen that have to react to market dynamics
  // FIXME: Refactor into its own service
  private async updateOpepenWithMarketDynamics(opepen) {
    // Handle Set 031
    await this.handleSet31(opepen.filter((o) => o.setId === 31))

    // Handle other things... (none for now)
  }

  private async handleSet31(opepen) {
    const editionsToFetch = new Set()

    for (const token of opepen) {
      editionsToFetch.add(token.data.edition)
    }

    for (const edition of editionsToFetch) {
      this.logger.info(`Importing set images for set 31; edition ${edition}!`)
      await this.kernel.exec('images:import-set-images', [
        '31',
        '--opensea=true',
        `--edition=${edition}`,
      ])
    }
  }
}
