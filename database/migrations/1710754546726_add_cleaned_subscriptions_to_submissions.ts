import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('reveal_submissions_input')
      table.string('reveal_submissions_input_cid')
      table.jsonb('reveal_submissions_output')
      table.string('reveal_submissions_output_cid')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('reveal_submissions_input')
      table.dropColumn('reveal_submissions_input_cid')
      table.dropColumn('reveal_submissions_output')
      table.dropColumn('reveal_submissions_output_cid')
    })
  }
}
