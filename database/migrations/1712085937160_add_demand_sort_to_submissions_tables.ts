import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('demand').defaultTo(0).index()
    })

    this.defer(async db => {
      await db.rawQuery(`
        UPDATE set_submissions
        SET demand = COALESCE(("submission_stats" -> 'demand' ->> 'total')::integer, 0);
      `)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('demand')
    })
  }
}
