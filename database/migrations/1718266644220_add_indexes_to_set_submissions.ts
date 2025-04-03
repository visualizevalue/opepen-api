import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.index('edition_1_image_id')
      table.index('edition_4_image_id')
      table.index('edition_5_image_id')
      table.index('edition_10_image_id')
      table.index('edition_20_image_id')
      table.index('edition_40_image_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('edition_1_image_id')
      table.dropIndex('edition_4_image_id')
      table.dropIndex('edition_5_image_id')
      table.dropIndex('edition_10_image_id')
      table.dropIndex('edition_20_image_id')
      table.dropIndex('edition_40_image_id')
    })
  }
}
