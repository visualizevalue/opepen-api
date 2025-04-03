import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { OPT_IN_HOURS } from 'App/Models/SetSubmission'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('remaining_reveal_time')
        .defaultTo(OPT_IN_HOURS * 60 * 60)
        .alter()
    })

    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .where('remaining_reveal_time', 24 * 60 * 60)
        .update({
          remaining_reveal_time: OPT_IN_HOURS * 60 * 60,
        })
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('remaining_reveal_time')
        .defaultTo(24 * 60 * 60)
        .alter()
    })
  }
}
