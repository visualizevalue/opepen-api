import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('address').references('address').inTable('accounts')
      table.integer('submission_id').references('id').inTable('set_submissions').nullable()
      table.bigInteger('opepen_id').references('token_id').inTable('opepens').nullable()
      table.bigInteger('image_id').references('id').inTable('images').nullable()

      table.bigInteger('parent_comment_id').references('id').inTable('comments').nullable()

      table.text('body')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })

    this.defer(async db => {
      await db.rawQuery(`
        INSERT INTO comments (address, submission_id, body, created_at, updated_at)
        SELECT address, submission_id, comment, created_at, created_at
        FROM set_subscriptions
        WHERE submission_id is not null
        AND comment != '';
      `)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
