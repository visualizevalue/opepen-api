import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Image from 'App/Models/Image'

export default class ImportImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'import:images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import images from URIs'

  @args.string()
  public uri: string

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const image = await Image.fromURI(this.uri)

    await image.generateScaledVersions()
  }
}
