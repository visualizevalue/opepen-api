import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'journeys'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .bigInteger('main_image_id')
        .references('id')
        .inTable('ai_images')
        .index('journeys_main_image_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('main_image_id')
    })
  }
}
