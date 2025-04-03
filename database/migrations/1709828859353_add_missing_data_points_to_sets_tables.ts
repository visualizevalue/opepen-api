import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('set_submissions', (table) => {
      table.boolean('rounded_preview').defaultTo('true')
      table.string('reveal_block_number')
      table.integer('min_subscription_percentage')
      table.timestamp('reveals_at', { useTz: true })
      table.string('reveal_strategy')
      table.timestamp('notification_sent_at', { useTz: true })
      table.jsonb('submission_stats')
      table.jsonb('submitted_opepen')
    })

    this.defer(async (db) => {
      const sets = await db.from('sets').whereNotNull('name')

      for (const set of sets) {
        const submission = await db
          .from('set_submissions')
          .where('set_id', set.id)
          .orderBy('published_at', 'desc')
          .first()

        if (!submission) continue

        await db.from('set_submissions').where('id', submission.id).update({
          submission_stats: set.submission_stats,
          submitted_opepen: set.submitted_opepen,
          reveal_strategy: set.reveal_strategy,
          reveals_at: set.reveals_at,
          notification_sent_at: set.notification_sent_at,
          min_subscription_percentage: set.min_subscription_percentage,
          reveal_block_number: set.reveal_block_number,
          rounded_preview: set.rounded_preview,
        })
      }
    })
  }

  public async down() {
    this.schema.alterTable('set_submissions', (table) => {
      table.dropColumn('rounded_preview')
      table.dropColumn('reveal_block_number')
      table.dropColumn('min_subscription_percentage')
      table.dropColumn('reveals_at')
      table.dropColumn('reveal_strategy')
      table.dropColumn('notification_sent_at')
      table.dropColumn('submission_stats')
      table.dropColumn('submitted_opepen')
    })
  }
}
