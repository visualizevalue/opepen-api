import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { DateTime } from 'luxon'

export default class extends BaseSchema {
  public async up() {
    this.defer(async (db) => {
      const now = DateTime.now().toISO()

      await db.rawQuery(
        `
        UPDATE set_submissions
        SET
          published_at = ?,
          approved_at = ?,
          starred_at = NULL
        WHERE starred_at is not null
        OR set_id is not null;
      `,
        [now, now],
      )

      await db.rawQuery(`
        UPDATE set_submissions
        SET
          starred_at = reveals_at
        WHERE set_id is not null;
      `)
    })
  }

  public async down() {
    //
  }
}
