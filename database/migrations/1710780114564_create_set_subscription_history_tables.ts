import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscription_history'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('address')
      table.jsonb('opepen_ids')
      table.jsonb('max_reveals')
      table.integer('submission_id').references('id').inTable('set_submissions')
      table.bigInteger('subscription_id').references('id').inTable('set_subscriptions')

      table.timestamp('created_at', { useTz: true })
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        INSERT INTO set_subscription_history (address, opepen_ids, max_reveals, submission_id, subscription_id, created_at)
        SELECT address, opepen_ids, max_reveals, submission_id, id, created_at
        FROM set_subscriptions;
      `)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
