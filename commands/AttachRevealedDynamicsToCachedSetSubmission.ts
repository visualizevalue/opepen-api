import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class AttachRevealedDynamicsToCachedSetSubmission extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'attach:revealed_dynamics_to_cached_set_submission'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Image } = await import('App/Models/Image')

    const images = await Image.query()
      .whereNotNull('opepenId')
      .whereNull('setSubmissionId')
      .preload('cachedOpepen', query => query.preload('set'))

    for (const image of images) {
      this.logger.info(`Opepen #${image.cachedOpepen.tokenId} - submission ${image.cachedOpepen.set.submission.uuid} ${image.cachedOpepen.set.submission.name}`)
      image.setSubmissionId = image.cachedOpepen.set.submission.id
      await image.save()
    }

    this.logger.info(images.length + ' opepen')
  }
}
