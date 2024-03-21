import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'opepens'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('submission_id').references('id').inTable('set_submissions')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('submissions_id')
    })
  }
}
