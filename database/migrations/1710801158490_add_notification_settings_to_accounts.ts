import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('notification_new_submission')
      table.boolean('notification_new_curated_submission')
      table.boolean('notification_reveal_started')
      table.boolean('notification_reveal_paused')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notification_new_submission')
      table.dropColumn('notification_new_curated_submission')
      table.dropColumn('notification_reveal_started')
      table.dropColumn('notification_reveal_paused')
    })
  }
}
