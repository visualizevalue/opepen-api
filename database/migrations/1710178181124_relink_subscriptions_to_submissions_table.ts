import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_subscriptions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('submission_id').references('id').inTable('set_submissions')
    })

    this.defer(async (db) => {
      const sets = await db.from('sets').whereNotNull('submission_id')

      for (const set of sets) {
        await db.from(this.tableName).where('set_id', set.id).update({
          submission_id: set.submission_id,
        })
      }
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('submission_id')
    })
  }
}
