import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ai_images'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('versions').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('versions')
    })
  }
}
