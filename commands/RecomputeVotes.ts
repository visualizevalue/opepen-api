import { BaseCommand, flags } from '@adonisjs/core/build/standalone'

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

  @flags.boolean()
  public removeDuplicates: boolean = true

  @flags.boolean()
  public recompute: boolean = true

  @flags.boolean()
  public scores: boolean = true

  public async run() {
    if (this.removeDuplicates) {
      await this.findAndRemoveDuplicates()
    }

    if (this.recompute) {
      await this.recomputePoints()
    }

    if (this.scores) {
      await this.recomputeScores()
    }

  }

  protected async findAndRemoveDuplicates () {
    const { default: Vote } = await import('App/Models/Vote')

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
        .orderBy('id')
        .first()

      // Delete all after first
      await Vote.query()
        .where('address', vote.address)
        .where('imageId', vote.imageId.toString())
        .where('id', '>', firstVote?.id.toString() || 0)
        .delete()
    }
  }

  protected async recomputePoints () {
    const { default: Image } = await import('App/Models/Image')

    await Image.query().doesntHave('votes').update({ points: 0, votesCount: 0 })

    const images = await Image.query().has('votes').preload('votes')
    this.logger.info(`Recomputing ${images.length} images`)

    for (const image of images) {
      image.points = 0
      image.votesCount = 0

      for (const vote of image.votes) {
        image.points += vote.points
        image.votesCount ++
      }

      await image.save()
    }
  }

  protected async recomputeScores () {
    const { default: Image } = await import('App/Models/Image')

    const images = await Image.query().where('votesCount', '>', 0)
    this.logger.info(`Recomputing ${images.length} image vote scores`)

    for (const image of images) {
      image.voteScore = image.points / image.votesCount

      await image.save()
    }
  }
}
