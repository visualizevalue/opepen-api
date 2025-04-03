import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class CleanOpepenImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'clean:dynamic_opepen_images'

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

    const dynamicSubmissions = await SetSubmission.query()
      .where('editionType', 'DYNAMIC')
      .whereNotNull('setId')
      .preload('edition1Image')

    for (const submission of dynamicSubmissions) {
      const oneOfOne = await Opepen.query()
        .where('setId', submission.setId)
        .whereJsonSuperset('data', { edition: 1 })
        .preload('image', (query) => query.preload('votes'))
        .first()

      if (!oneOfOne) {
        this.logger.info(`no one of one found for ${submission.name}`)
        continue
      }

      // Ensure one of ones
      if (submission.edition1Image.id !== oneOfOne.image.id) {
        await oneOfOne.image.clearCashed()

        submission.edition1Image.opepenId = oneOfOne.tokenId as bigint
        await submission.edition1Image.save()

        oneOfOne.imageId = submission.edition1Image.id
        await oneOfOne.save()
        await oneOfOne.load('image')
        await oneOfOne.updateImage()
      }

      if (!oneOfOne.imageId) {
        this.logger.info(`no one of one image defined`)
        continue
      }

      const others = await Opepen.query()
        .where('imageId', oneOfOne.imageId.toString())
        .whereNot('tokenId', oneOfOne.tokenId.toString())

      this.logger.info(`found ${others.length} duplicate images; disconnecting`)

      for (const token of others) {
        token.imageId = null
        await token.updateImage()
        this.logger.info(
          `update image for #${token.tokenId} (1/${token.data.edition}; set ${token.setId})`,
        )
      }
    }
  }
}
