import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Reveal from 'App/Services/Metadata/Reveal/Reveal'

export default class SetRevealImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'reveal:update-images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Execute pending reveals'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  public async run() {
    const { default: SetModel } = await import('App/Models/SetModel')

    const set = await SetModel.query()
      .preload('submission', query => {
        query.preload('dynamicSetImages')
      })
      .preload('opepen')
      .where('id', this.set).firstOrFail()

    for (const opepen of set.opepen) {
      await (new Reveal()).generateMetadataFor(Number(opepen.tokenId), opepen.setEditionId, set.submission, set)
      this.logger.info(`Executed metadata generation for opepen ${opepen.tokenId}`)
    }
  }
}
