import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class CleanOpepenImages extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'clean:opepen_images'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    await this.kernel.exec('cache:main_image_relations', [])

    await this.normalizePrintSubmissionOpepen()
    await this.normalizeNumberedPrintSubmissionOpepen()
    await this.normalizeDynamicSubmissionOpepen()

    await this.kernel.exec('votes:recompute', [])
  }

  protected async normalizePrintSubmissionOpepen() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')
    const { default: Opepen } = await import('App/Models/Opepen')

    const revealedPrintSubmissions = await SetSubmission.query()
      .whereNotNull('setId')
      .whereNotNull('revealBlockNumber')
      .where('editionType', 'PRINT')
      .preload('edition1Image', (query) => query.preload('votes'))
      .preload('edition4Image', (query) => query.preload('votes'))
      .preload('edition5Image', (query) => query.preload('votes'))
      .preload('edition10Image', (query) => query.preload('votes'))
      .preload('edition20Image', (query) => query.preload('votes'))
      .preload('edition40Image', (query) => query.preload('votes'))

    let submissionsCount = 0
    let imagesCount = 0

    for (const submission of revealedPrintSubmissions) {
      const opepen = await Opepen.query()
        .where('setId', submission.setId)
        .preload('image', (query) => query.preload('votes'))

      for (const token of opepen) {
        const image = submission[`edition${token.data.edition}Image`]

        if (token.tokenId == 3750n) {
          this.logger.info(
            `006 1/1: ${token.imageId}:${submission[`edition${token.data.edition}Image`].id}`,
          )
        }

        if (token.imageId !== submission[`edition${token.data.edition}Image`].id) {
          this.logger.info(
            `${submission.name}: ${token.data.edition} (${token.imageId}:${submission[`edition${token.data.edition}Image`].id})`,
          )

          // Clear old cached non normalized relations and computed points
          token.image.points = 0
          await token.image.clearCashed()

          // Swap image votes
          for (const vote of token.image.votes) {
            vote.imageId = image.id
            await vote.save()
          }
          await image.calculatePoints()

          // Swap image
          token.imageId = image.id

          // Restore cached non normalized relations
          image.setSubmissionId = submission.id
        }

        // Clean the cached opepen
        image.opepenId = null

        await token.save()
        await image.save()
        imagesCount++

        // Handle set 31
        if (token.setId === 31) {
          await token.updateImage()
        }
      }

      submissionsCount++
    }

    this.logger.info(
      `Cleaned mapping for ${submissionsCount} print submissions (updated ${imagesCount} images)`,
    )
  }

  protected async normalizeNumberedPrintSubmissionOpepen() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')
    const { default: Opepen } = await import('App/Models/Opepen')
    const EDITIONS = [1, 4, 5, 10, 20, 40]

    const revealedNumberedPrintSubmissions = await SetSubmission.query()
      .whereNotNull('setId')
      .whereNotNull('revealBlockNumber')
      .where('editionType', 'NUMBERED_PRINT')
      .preload('edition1Image', (query) => query.preload('votes'))
      .preload('edition4Image', (query) => query.preload('votes'))
      .preload('edition5Image', (query) => query.preload('votes'))
      .preload('edition10Image', (query) => query.preload('votes'))
      .preload('edition20Image', (query) => query.preload('votes'))
      .preload('edition40Image', (query) => query.preload('votes'))

    let submissionsCount = 0

    for (const submission of revealedNumberedPrintSubmissions) {
      // Detach opepen and get max points
      for (const edition of EDITIONS) {
        const opepen = await Opepen.query()
          .where('setId', submission.setId)
          .whereJsonSuperset('data', { edition })
          .preload('image', (query) => query.preload('votes'))

        for (const token of opepen) {
          await token.image.clearCashed()

          for (const vote of token.image.votes) {
            vote.imageId = submission[`edition${edition}Image`].id
            await vote.save()
          }
        }
      }

      submissionsCount++
    }

    this.logger.info(`Cleaned mapping for ${submissionsCount} numbered print submissions`)
  }

  protected async normalizeDynamicSubmissionOpepen() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')
    const { default: Opepen } = await import('App/Models/Opepen')

    const dynamicSubmissions = await SetSubmission.query()
      .where('editionType', 'DYNAMIC')
      .preload('edition1Image', (query) => query.preload('votes'))
      .preload('edition4Image', (query) => query.preload('votes'))
      .preload('edition5Image', (query) => query.preload('votes'))
      .preload('edition10Image', (query) => query.preload('votes'))
      .preload('edition20Image', (query) => query.preload('votes'))
      .preload('edition40Image', (query) => query.preload('votes'))

    let submissionsCount = 0

    for (const submission of dynamicSubmissions) {
      const previewImages = [
        submission.edition4Image,
        submission.edition5Image,
        submission.edition10Image,
        submission.edition20Image,
        submission.edition40Image,
      ].filter((i) => !!i)

      for (const previewImage of previewImages) {
        previewImage.setSubmissionId = null
        previewImage.points = 0
        for (const vote of previewImage.votes) {
          try {
            await vote.delete()
          } catch (e) {}
        }
        await previewImage.save()
      }

      if (submission.setId) {
        const oneOfOne = await Opepen.query()
          .where('setId', submission.setId)
          .whereJsonSuperset('data', { edition: 1 })
          .preload('image', (query) => query.preload('votes'))
          .first()

        if (!oneOfOne) continue

        if (submission.edition1Image.id !== oneOfOne.image.id) {
          oneOfOne.image.points = 0
          await oneOfOne.image.clearCashed()

          for (const vote of oneOfOne.image.votes) {
            vote.imageId = submission.edition1Image.id
            await vote.save()
          }

          submission.edition1Image.opepenId = oneOfOne.tokenId as bigint
          await submission.edition1Image.save()

          oneOfOne.imageId = submission.edition1Image.id
          await oneOfOne.save()
        }
      }

      submissionsCount++
    }

    this.logger.info(`Cleaned mapping for ${submissionsCount} dynamic submissions`)
  }
}
