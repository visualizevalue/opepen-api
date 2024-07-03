import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'images'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.float('vote_score', 2)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('vote_score')
    })
  }
}
