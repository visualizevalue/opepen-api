import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('creator').references('address').inTable('accounts')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('creator')
    })
  }
}
