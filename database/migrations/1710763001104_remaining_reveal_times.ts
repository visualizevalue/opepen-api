import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('remaining_reveal_time').defaultTo(24 * 60 * 60)
    })

    this.defer(async (db) => {
      const publishedSets = await db.from('sets').whereNotNull('submission_id')

      for (const set of publishedSets) {
        await db.from(this.tableName).where('set_id', set.id).update({
          remaining_reveal_time: 0,
        })
      }
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('remaining_reveal_time')
    })
  }
}
