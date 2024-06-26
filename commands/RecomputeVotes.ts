import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class RecomputeVotes extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'votes:recompute'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Vote } = await import('App/Models/Vote')
    const { default: Image } = await import('App/Models/Image')

    this.logger.info('Find duplicate votes')

    const votes = await Vote.query()
      .select(['address', 'image_id'])
      .count('* as count')
      .groupBy(['address', 'image_id'])
      .havingRaw('count(*) > 1')
      .orderBy('count', 'desc')

    this.logger.info(`Found ${votes.length} duplicates`)

    for (const vote of votes) {
      const firstVote = await Vote.query()
        .where('address', vote.address)
        .where('imageId', vote.imageId.toString())
        .orderBy('createdAt')
        .first()

      // Delete all after first
      await Vote.query()
        .where('address', vote.address)
        .where('imageId', vote.imageId.toString())
        .where('id', '>', firstVote?.id.toString() || 0)
        .delete()
    }


    const images = await Image.query().has('votes').preload('votes')
    this.logger.info(`Recomputing ${images.length} images`)

    for (const image of images) {
      image.points = 0

      for (const vote of image.votes) {
        image.points += vote.points
      }

      await image.save()
    }
  }
}
