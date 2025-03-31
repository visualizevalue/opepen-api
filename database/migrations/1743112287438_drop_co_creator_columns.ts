import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('co_creator_1')
      table.dropColumn('co_creator_2')
      table.dropColumn('co_creator_3')
      table.dropColumn('co_creator_4')
      table.dropColumn('co_creator_5')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('co_creator_1')
      table.string('co_creator_2')
      table.string('co_creator_3')
      table.string('co_creator_4')
      table.string('co_creator_5')
    })
  }
}
