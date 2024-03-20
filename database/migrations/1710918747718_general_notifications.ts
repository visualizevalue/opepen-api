import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('notification_general').defaultTo(true)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notification_general')
    })
  }
}
