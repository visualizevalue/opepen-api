import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'co_creators'

  public async up() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_manual').notNullable().defaultTo(true)
      table.boolean('is_selected_contributor').notNullable().defaultTo(false)
    })

    await this.db.rawQuery(`
      DELETE FROM co_creators duplicate
      USING co_creators original
      WHERE duplicate.id > original.id
        AND duplicate.set_submission_id = original.set_submission_id
        AND duplicate.account_id = original.account_id
    `)

    await this.schema.alterTable(this.tableName, (table) => {
      table.unique(['set_submission_id', 'account_id'])
    })
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['set_submission_id', 'account_id'])
      table.dropColumn('is_manual')
      table.dropColumn('is_selected_contributor')
    })
  }
}
