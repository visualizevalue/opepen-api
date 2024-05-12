import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'timeline'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.bigInteger('cast_id').references('id').inTable('casts')

      table.renameColumn('account', 'address')
    })

    this.defer(async db => {
      // Copy over posts
      await db.rawQuery(`
        INSERT INTO timeline (
          post_id, address, created_at, type
        )
        SELECT id, address, created_at, 'POST:INTERNAL'
        FROM posts;
      `)

      // Copy over casts
      await db.rawQuery(`
        INSERT INTO timeline (
          cast_id, address, created_at, type
        )
        SELECT id, address, created_at, 'POST:FARCASTER'
        FROM casts;
      `)

      // Copy over token events
      await db.rawQuery(`
        INSERT INTO timeline (
          event_id, address, opepen_id, block_number, created_at, type
        )
        SELECT id, "to", token_id, block_number, timestamp, 'TOKEN:TRANSFER'
        FROM events;
      `)

      // Copy over set submissions
      await db.rawQuery(`
        INSERT INTO timeline (
          submission_id, address, created_at, type
        )
        SELECT id, creator, approved_at, 'SET_SUBMISSION:PUBLISH'
        FROM set_submissions;
      `)

      // Copy over opt ins
      await db.rawQuery(`
        INSERT INTO timeline (
          submission_id, subscription_id, subscription_history_id, address, created_at, type
        )
        SELECT submission_id, subscription_id, id, address, created_at, 'SET_SUBMISSION:OPT_IN'
        FROM set_subscription_history;
      `)
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('cast_id')

      table.renameColumn('address', 'account')
    })

    this.defer(async db => {
      await db.from('timeline').delete()
    })
  }
}
