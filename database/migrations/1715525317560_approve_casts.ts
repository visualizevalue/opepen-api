import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'casts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('approved_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('approved_at')
    })
  }
}
