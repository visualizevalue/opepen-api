import { BaseCommand } from '@adonisjs/core/build/standalone'
import OpenSea from 'App/Services/OpenSea'
import priceOracle from 'App/Services/PriceOracle'

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

    // Update ETH/USD price
    await priceOracle.update()
    const ethUsdPrice = priceOracle.ethPrice?.USD || 0
    this.logger.info(`Current ETH/USD price: $${ethUsdPrice}`)

    // Clear old orders
    const outdated = await Opepen.query().whereNotNull('price')
    const outdatedTokenIds = outdated.map((o) => o.tokenId.toString())
    for (const o of outdated) {
      o.price = null
      delete o.data.order

      await o.save()
    }
    this.logger.info(`Cleared out ${outdated.length} old orders`)

    // Fetch current listings from OpenSea
    const listings = await OpenSea.getAllListings()
    this.logger.info(`${listings.length} OpenSea listings found`)

    // Keep track of opepen to update
    const opepenToUpdate: any[] = []
    const distinctTokens = new Set<string>()

    // Save our order data
    for (const listing of listings) {
      // Extract token ID from the listing's offer
      const offer = listing.protocol_data?.parameters?.offer?.[0]
      if (!offer) continue

      const tokenId = offer.identifierOrCriteria
      distinctTokens.add(tokenId)

      const opepen = await Opepen.find(tokenId)
      if (!opepen || opepen.price) continue

      // Only process ETH listings
      if (listing.price?.current?.currency !== 'ETH') continue

      // Price value is already in wei (raw format)
      opepen.price = BigInt(listing.price.current.value)

      // Calculate decimal price (value / 10^decimals)
      const decimalPrice =
        Number(listing.price.current.value) / Math.pow(10, listing.price.current.decimals)

      // Calculate USD price using the price oracle
      const usdPrice = decimalPrice * ethUsdPrice

      opepen.data.order = {
        source: 'opensea.io',
        price: {
          raw: opepen.price.toString(),
          decimal: decimalPrice,
          usd: usdPrice,
        },
      }

      await opepen.save()

      // If we're a new listing, we might want to repull images or the like
      if (!outdatedTokenIds.includes(tokenId)) opepenToUpdate.push(opepen)
    }

    // Maybe update opepen w special rules
    await this.updateOpepenWithMarketDynamics(opepenToUpdate)

    this.logger.info(
      `Imported ${listings.length} new orders (for ${distinctTokens.size} Opepen)`,
    )
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
      await this.kernel.exec('images:import-set-images', ['31', `--edition=${edition}`])
    }
  }
}
