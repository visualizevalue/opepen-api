import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bids'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('order_hash').notNullable().unique()
      table.string('bidder').notNullable().index()
      table.string('amount').nullable()
      table.string('currency').nullable()
      table.integer('token_amount').nullable()
      table.text('token_ids').nullable()
      table.timestamp('start_time', { useTz: true }).nullable()
      table.timestamp('end_time', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
