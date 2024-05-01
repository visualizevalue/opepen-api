import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'timeline'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.timestamp('created_at', { useTz: true })
      table.string('block_number')
      table.string('type')
      table.string('account')

      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('event_id').references('id').inTable('events')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
      table.integer('submission_id').references('id').inTable('set_submissions')
      table.integer('subscription_id').references('id').inTable('set_subscriptions')
      table.bigInteger('subscription_history_id').references('id').inTable('set_subscription_history')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
