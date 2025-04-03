import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('points').index()
      table.integer('votes_count').index()
      table.float('vote_score', 2).index()
    })

    this.defer(async (db) => {
      const submissions = await db.from('set_submissions').whereNotNull('approved_at')

      for (const submission of submissions) {
        const images = await db.from('images').where('set_submission_id', submission.id)

        let points = 0
        let votesCount = 0

        for (const image of images) {
          points += image.points || 0
          votesCount += image.votes_count || 0
        }

        await db
          .from('set_submissions')
          .where('id', submission.id)
          .update({
            points: points,
            votes_count: votesCount,
            vote_score: votesCount > 0 ? (points / votesCount).toFixed(2) : 0,
          })
      }
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('points')
      table.dropColumn('votes_count')
      table.dropColumn('vote_score')
    })
  }
}
