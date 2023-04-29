import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscriptions'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('set_id').references('id').inTable('sets')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
      table.unique(['set_id', 'opepen_id'])

      table.string('address')
      table.string('message')

      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
