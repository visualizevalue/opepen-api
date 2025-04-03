import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('set_id').references('id').inTable('sets')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('set_id')
    })
  }
}
