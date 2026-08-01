import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'co_creators'

  public async up() {
    if (!(await this.schema.hasColumn(this.tableName, 'is_manual'))) {
      await this.db.rawQuery(`
        ALTER TABLE co_creators
        ADD COLUMN is_manual boolean NOT NULL DEFAULT true
      `)
    }

    if (!(await this.schema.hasColumn(this.tableName, 'is_selected_contributor'))) {
      await this.db.rawQuery(`
        ALTER TABLE co_creators
        ADD COLUMN is_selected_contributor boolean NOT NULL DEFAULT false
      `)
    }

    await this.db.rawQuery(`
      DELETE FROM co_creators duplicate
      USING co_creators original
      WHERE duplicate.id > original.id
        AND duplicate.set_submission_id = original.set_submission_id
        AND duplicate.account_id = original.account_id
    `)

    await this.db.rawQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS co_creators_submission_account_unique
      ON co_creators (set_submission_id, account_id)
    `)
  }

  public async down() {
    await this.db.rawQuery(`
      DROP INDEX IF EXISTS co_creators_submission_account_unique
    `)

    if (await this.schema.hasColumn(this.tableName, 'is_manual')) {
      await this.db.rawQuery(`ALTER TABLE co_creators DROP COLUMN is_manual`)
    }

    if (await this.schema.hasColumn(this.tableName, 'is_selected_contributor')) {
      await this.db.rawQuery(`ALTER TABLE co_creators DROP COLUMN is_selected_contributor`)
    }
  }
}
