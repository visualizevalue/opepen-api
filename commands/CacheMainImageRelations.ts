import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class CacheMainImageRelations extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'cache:main_image_relations'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Connect images to their main parent (artist, posts, set_submission, opepen) for easy querying.'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    await this.detatchAll()
    await this.attachPostImages()
    await this.attachOpepenImages()
    await this.attachSetImages()
  }

  protected async detatchAll () {
    const { default: Image } = await import('App/Models/Image')

    await Image.query().update({
      postId: null,
      castId: null,
      opepenId: null,
      setSubmissionId: null,
    })

    this.logger.info(`Detatched main relations`)
  }

  protected async attachPostImages () {
    this.logger.info(`Attaching images to posts`)

    const { default: Image } = await import('App/Models/Image')

    const images = await Image.query().has('posts').preload('posts')

    for (const image of images) {
      image.postId = image.posts[0].id
      image.creator = image.posts[0].address
      await image.save()
    }

    this.logger.info(`Attached ${images.length} images to posts`)
  }

  protected async attachOpepenImages () {
    this.logger.info(`Attaching images to opepen`)

    const { default: Opepen } = await import('App/Models/Opepen')

    const opepen = await Opepen.query().whereNotNull('setId').whereNotNull('imageId').preload('image').preload('set')

    let skippedPrintCount = 0
    let count = 0
    for (const token of opepen) {
      if (token.set.submission.editionType !== 'DYNAMIC') {
        skippedPrintCount++
        continue
      }

      token.image.opepenId = token.tokenId as bigint
      token.image.creator = token.set.submission.creator
      await token.image.save()

      count++
    }

    this.logger.info(`Attached ${count} images to opepen (skipped ${skippedPrintCount} for prints)`)
  }

  protected async attachSetImages () {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    this.logger.info(`Attaching images to sets`)

    const submissions = await SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('dynamicSetImages')

    let count = 0

    for (const submission of submissions) {
      const images = [
        submission.edition1Image,
        submission.edition4Image,
        submission.edition5Image,
        submission.edition10Image,
        submission.edition20Image,
        submission.edition40Image,
        ...(await submission.dynamicSetImages?.images() || []),
      ].filter(image => !! image)

      for (const image of images) {
        image.setSubmissionId = submission.id
        image.creator = submission.creator
        await image.save()
        count++
      }
    }

    this.logger.info(`Attached ${count} images to sets`)
  }

}
