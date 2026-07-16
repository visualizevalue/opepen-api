import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('max_contributions_per_contributor').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('max_contributions_per_contributor')
    })
  }
}
