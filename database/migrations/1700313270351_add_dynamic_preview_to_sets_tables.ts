import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('sets', (table) => {
      table.string('dynamic_preview_image_id')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.string('dynamic_preview_image_id')
    })
  }

  public async down() {
    this.schema.alterTable('sets', (table) => {
      table.dropColumn('dynamic_preview_image_id')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.dropColumn('dynamic_preview_image_id')
    })
  }
}
