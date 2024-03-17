import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('oauth').defaultTo({})
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('oauth')
    })
  }
}
