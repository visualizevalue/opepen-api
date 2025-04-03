import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opepens'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('image_id').references('id').inTable('images')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('image_id')
    })
  }
}
