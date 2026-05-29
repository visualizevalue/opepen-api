import BaseSchema from '@ioc:Adonis/Lucid/Schema'

// v5 — forward-only migration.
// Records a revealed Opepen moving forward from one set into another. Old sets
// only shrink; this table is the lineage / "evolutionary history" of a token.
export default class extends BaseSchema {
  public async up() {
    this.schema.createTable('token_migrations', (table) => {
      table.bigIncrements('id')

      table.bigInteger('token_id').notNullable().index()
      table.integer('from_set_id').nullable()
      table.integer('to_set_id').notNullable()
      table.integer('from_submission_id').nullable()
      table.integer('to_submission_id').nullable()

      table.timestamp('migrated_at', { useTz: true })
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.index(['token_id', 'migrated_at'])
    })

    // Per-submission opt-in: only sets explicitly marked may receive revealed
    // (migrating) Opepen. Defaults to false, so current behaviour is unchanged.
    this.schema.alterTable('set_submissions', (table) => {
      table.boolean('allow_forward_migration').defaultTo(false)
    })
  }

  public async down() {
    this.schema.dropTable('token_migrations')
    this.schema.alterTable('set_submissions', (table) => {
      table.dropColumn('allow_forward_migration')
    })
  }
}
