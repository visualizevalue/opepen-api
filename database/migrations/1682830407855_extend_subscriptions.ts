import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscriptions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('signature')
      table.text('message').alter()

      table.dropColumn('opepen_id')
      table.jsonb('opepen_ids')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id')
      table.dropColumn('signature')
      table.string('message').alter()
      table.dropColumn('opepen_ids')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
    })
  }
}
