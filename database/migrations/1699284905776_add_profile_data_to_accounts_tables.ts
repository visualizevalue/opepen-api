import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('cover_image_id').references('id').inTable('images')

      table.text('tagline')
      table.text('quote')
      table.text('bio')
      table.jsonb('socials')
    })

    this.schema.createTable('portfolio_items', table => {
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

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cover_image_id')
      table.dropColumn('tagline')
      table.dropColumn('quote')
      table.dropColumn('bio')
      table.dropColumn('socials')
    })

    this.schema.dropTable('portfolio_items')
  }
}
