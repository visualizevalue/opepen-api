import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'generatives'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id')

      table.string('address').references('address').inTable('accounts')

      table.string('type')
      table.text('code')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
