import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up () {
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
  }

  public async down () {
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
