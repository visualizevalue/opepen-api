import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opepens'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('set_edition_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('set_edition_id')
    })
  }
}
