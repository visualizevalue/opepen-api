import { BaseCommand } from '@adonisjs/core/build/standalone'

const setsToRelink = [
  4,
  // 5,
  // 10,
  // 28,
]

export default class FixNonStaticSets extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'images:fix_non_static_sets'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')
    const { default: Opepen } = await import('App/Models/Opepen')

    const submissions = await SetSubmission.query().whereIn('setId', setsToRelink)

    for (const submission of submissions) {
      const opepen = await Opepen.query().where('setId', submission.setId).preload('image')

      for (const token of opepen) {
        this.logger.info(`#${token.tokenId}: ${JSON.stringify(token.metadata.animation_url)}`)
        await token.updateImage()
      }
    }
  }
}
