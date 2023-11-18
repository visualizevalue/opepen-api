import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('notification_sent_at', { useTz: true }).nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notification_sent_at')
    })
  }
}
