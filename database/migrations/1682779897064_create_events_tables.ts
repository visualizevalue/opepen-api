import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'events'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('contract')
      table.bigInteger('token_id')
      table.string('type')
      table.string('from').references('address').inTable('accounts').index('check_events_from')
      table.string('to').references('address').inTable('accounts').index('check_events_to')
      table.decimal('value', 128, 0).nullable()
      table.jsonb('data')
      table.string('transaction_hash')
      table.string('log_index')
      table.string('block_number')

      table.timestamp('timestamp', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
