import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('sets_count').defaultTo(0)
      table.integer('set_submissions_count').defaultTo(0)
      table.integer('profile_completion').defaultTo(0)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('sets_count')
      table.dropColumn('set_submissions_count')
      table.dropColumn('profile_completion')
    })
  }
}
