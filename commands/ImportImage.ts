import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import { DateTime } from 'luxon'

export default class ImportImage extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:import'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import and image from a URI'

  @args.string()
  public uri: string

  @flags.boolean({ alias: 'f' })
  public featured: boolean

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Image } = await import('App/Models/Image')

    const image = await Image.fromURI(this.uri)

    await image.generateScaledVersions()

    if (this.featured) {
      image.featuredAt = DateTime.now()

      await image.save()
    }

    this.logger.info(`Image #${image.id} from ${this.uri} created`)
  }
}
