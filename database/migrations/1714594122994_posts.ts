import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'posts'
  protected pivotTableName = 'images_posts'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.string('account')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.text('content')
    })

    this.schema.createTable(this.pivotTableName, (table) => {
      table.bigIncrements('id')
      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('image_id').references('id').inTable('images')
    })
  }

  public async down () {
    this.schema.dropTable(this.pivotTableName)
    this.schema.dropTable(this.tableName)
  }
}
