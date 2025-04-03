import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('approved_at')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('approved_at', { useTz: true })
    })
  }
}
