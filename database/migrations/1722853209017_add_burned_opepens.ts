import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName       = 'burned_opepens'
  protected opepenTableName = 'opepens'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigInteger('token_id').primary()

      table.string('owner').references('address').inTable('accounts').index('burned_opepens_owner')

      // Buy Now Price
      table.decimal('price', 128, 0).nullable()

      // Meta info
      table.jsonb('data')

      table.bigInteger('image_id').nullable()

      table.timestamp('updated_at', { useTz: true })
      table.timestamp('burned_at', { useTz: true })
    })

    this.schema.alterTable(this.opepenTableName, (table) => {
      table.bigInteger('burned_opepen_id').references('token_id').inTable('opepens')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)

    this.schema.alterTable(this.opepenTableName, (table) => {
      table.dropColumn('burned_opepen_id')
    })
  }
}
