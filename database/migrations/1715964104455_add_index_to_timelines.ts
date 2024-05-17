import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'timeline'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.index('created_at')
      table.index('type')
      table.index('address')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex('created_at')
      table.dropIndex('type')
      table.dropIndex('address')
    })
  }
}
