import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'images'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('cast_id').references('id').inTable('casts')
      table.integer('set_submission_id').references('id').inTable('set_submissions')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('post_id')
      table.dropColumn('cast_id')
      table.dropColumn('set_submission_id')
      table.dropColumn('opepen_id')
    })
  }
}
