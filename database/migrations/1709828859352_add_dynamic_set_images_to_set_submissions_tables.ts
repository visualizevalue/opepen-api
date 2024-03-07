import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up () {
    this.schema.alterTable('set_submissions', (table) => {
      table.integer('dynamic_set_images_id').references('id').inTable('dynamic_set_images')
    })
    this.schema.alterTable('sets', (table) => {
      table.integer('dynamic_set_images_id').references('id').inTable('dynamic_set_images')
    })
  }

  public async down () {
    this.schema.alterTable('set_submissions', (table) => {
      table.dropColumn('dynamic_set_images_id')
    })
    this.schema.alterTable('sets', (table) => {
      table.dropColumn('dynamic_set_images_id')
    })
  }
}
