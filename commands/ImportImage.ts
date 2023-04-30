import { BaseCommand, args, flags } from '@adonisjs/core/build/standalone'
import Image from 'App/Models/Image'
import { DateTime } from 'luxon'

export default class ImportImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'import:image'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import images from URIs'

  @args.string()
  public uri: string

  @flags.boolean()
  public featured: boolean

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const image = await Image.fromURI(this.uri)

    await image.generateScaledVersions()

    if (this.featured) {
      image.featuredAt = DateTime.now()

      await image.save()
    }

    this.logger.info(`Image #${image.id} from ${this.uri} created`)
  }
}
