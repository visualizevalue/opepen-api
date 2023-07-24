import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscriptions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('max_reveals')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_reveals')
    })
  }
}
