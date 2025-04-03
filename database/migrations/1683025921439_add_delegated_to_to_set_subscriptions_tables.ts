import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscriptions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('delegated_by')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('delegated_by')
    })
  }
}
