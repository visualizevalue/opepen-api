import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'rich_content_links'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('address').references('address').inTable('accounts').nullable()
      table.integer('set_id').references('id').inTable('sets').nullable()
      table.integer('set_submission_id').references('id').inTable('set_submissions').nullable()

      table.integer('sort_index')
      table.text('url')
      table.string('title')
      table.text('description')
      table.bigInteger('logo_image_id').references('id').inTable('images')
      table.bigInteger('cover_image_id').references('id').inTable('images')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.schema.dropTable('portfolio_items')
  }

  public async down() {
    this.schema.dropTable(this.tableName)

    this.schema.createTable('portfolio_items', (table) => {
      table.bigIncrements('id')
      table.string('address').references('address').inTable('accounts')
      table.integer('sort_index')
      table.text('url')
      table.string('title')
      table.text('description')
      table.bigInteger('logo_image_id').references('id').inTable('images')
      table.bigInteger('cover_image_id').references('id').inTable('images')
    })
  }
}
