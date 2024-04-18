import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscription_history'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('previous_opepen_ids')
      table.integer('opepen_count')
      table.integer('previous_opepen_count')
    })

    this.defer(async db => {
      await db.rawQuery(`
        UPDATE set_subscription_history
        SET opepen_count = COALESCE(jsonb_array_length("opepen_ids")::integer, 0);
      `)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('previous_opepen_ids')
      table.dropColumn('opepen_count')
      table.dropColumn('previous_opepen_count')
    })
  }
}
