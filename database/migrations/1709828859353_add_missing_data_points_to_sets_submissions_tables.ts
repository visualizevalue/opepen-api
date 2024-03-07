import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('rounded_preview').defaultTo('true')
      table.string('reveal_block_number')
      table.timestamp('reveals_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('rounded_preview')
      table.dropColumn('reveal_block_number')
      table.dropColumn('reveals_at')
    })
  }
}
