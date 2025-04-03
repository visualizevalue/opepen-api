import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'votes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.timestamp('created_at', { useTz: true })

      table.string('address').references('address').inTable('accounts')

      table.integer('points')

      table.bigInteger('image_id').references('id').inTable('images')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
