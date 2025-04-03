import { args, BaseCommand, flags } from '@adonisjs/core/build/standalone'
import Drive from '@ioc:Adonis/Core/Drive'

export default class ReplaceImageFileContents extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:replace_file_contents'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  @flags.string()
  public find: string = ' width="2000" height="2000"'

  @flags.string()
  public replace: string = ''

  @flags.string()
  public mime: string = 'image/svg+xml'

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')

    const opepen = await Opepen.query().where('set_id', this.set).preload('image')

    for (const token of opepen) {
      const path = `${token.image.path}/${token.image.uuid}.${token.image.type}`
      this.logger.info(`Update ${token.tokenId}, ${path}`)

      this.logger.info(`1. Download image`)
      const image = await Drive.get(
        `${token.image.path}/${token.image.uuid}.${token.image.type}`,
      )

      this.logger.info(`2. Find "${this.find}"; Replace "${this.replace}"`)
      const newImageStr = image.toString().replace(this.find, this.replace)

      this.logger.info(`3. Upload image`)
      await Drive.put(path, newImageStr, { contentType: this.mime })
    }
  }
}
