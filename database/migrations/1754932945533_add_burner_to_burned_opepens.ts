import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'burned_opepens'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('burner').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('burner')
    })
  }
}
