import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('uuid').unique()

      table.string('creator').references('address').inTable('accounts')

      table.string('name')
      table.text('description')

      table.string('edition_1_name')
      table.string('edition_4_name')
      table.string('edition_5_name')
      table.string('edition_10_name')
      table.string('edition_20_name')
      table.string('edition_40_name')
      table.bigInteger('edition_1_image_id').references('id').inTable('images')
      table.bigInteger('edition_4_image_id').references('id').inTable('images')
      table.bigInteger('edition_5_image_id').references('id').inTable('images')
      table.bigInteger('edition_10_image_id').references('id').inTable('images')
      table.bigInteger('edition_20_image_id').references('id').inTable('images')
      table.bigInteger('edition_40_image_id').references('id').inTable('images')

      table.boolean('is_dynamic')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
      table.timestamp('deleted_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
