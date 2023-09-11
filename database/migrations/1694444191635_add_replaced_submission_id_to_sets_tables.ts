import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('replaced_submission_id').references('id').inTable('set_submissions')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('replaced_submission_id')
    })
  }
}
