import { BaseCommand, flags } from '@adonisjs/core/build/standalone'
import axios from 'axios'

export default class OpepenMetadataImport extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:import-metadata'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import the metadata from the metadata api'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @flags.number()
  public from: number = 1

  @flags.number()
  public to: number = 16_000

  @flags.boolean()
  public revealed: boolean = true

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    this.logger.info('Import Opepen Metadata')

    const query = Opepen.query()
      .where('tokenId', '>=', this.from)
      .where('tokenId', '<=', this.to)

    if (this.revealed) {
      query.whereNotNull('revealedAt')
    }

    const opepens = await query.orderBy('tokenId')

    for (const opepen of opepens) {
      const { data: metadata } = await axios.get(`https://metadata.opepen.art/${opepen.tokenId}/metadata.json`)

      delete metadata.name
      delete metadata.description

      metadata.attributes = metadata.attributes
        .filter(({ trait_type }) => ['Artist', 'Release', 'Set', 'Opepen', 'Edition Size'].includes(trait_type))

      opepen.metadata = metadata
      await opepen.save()

      this.logger.info(`Opepen ${opepen.tokenId} metadata saved`)
    }
  }
}
