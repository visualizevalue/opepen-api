import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opepens'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigInteger('token_id').primary()

      table.string('owner').references('address').inTable('accounts').index('opepens_owner')

      // Buy Now Price
      table.decimal('price', 128, 0).nullable()

      // Meta info
      table.jsonb('data')
      table.text('search_string')

      table.timestamp('updated_at', { useTz: true })
      table.timestamp('revealed_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
