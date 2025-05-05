import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('contributions_count').defaultTo(0)
      table.integer('contributors_count').defaultTo(0)
    })

    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE set_submissions
        SET contributions_count = (
          SELECT COUNT(*)
          FROM participation_images
          WHERE 
            participation_images.set_submission_id = set_submissions.id
            AND participation_images.deleted_at IS NULL
        )
      `)

      await db.rawQuery(`
        UPDATE set_submissions
        SET contributors_count = (
          SELECT COUNT(DISTINCT creator_address)
          FROM participation_images
          WHERE 
            participation_images.set_submission_id = set_submissions.id
            AND participation_images.deleted_at IS NULL
        )
      `)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('contributions_count')
      table.dropColumn('contributors_count')
    })
  }
}
