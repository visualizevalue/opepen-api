import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  public async up() {
    this.schema.dropTable('images_posts')
    this.schema.dropTable('timeline')
    this.schema.dropTable('posts')

    this.schema.renameTable('comments', 'posts')

    this.schema.alterTable('posts', (table) => {
      table.renameColumn('parent_comment_id', 'parent_post_id')
      table.timestamp('approved_at', { useTz: true })
      table.text('signature')
    })

    this.schema.createTable('images_posts', (table) => {
      table.bigIncrements('id')
      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('image_id').references('id').inTable('images')
    })

    this.schema.createTable('timeline', (table) => {
      table.bigIncrements('id')
      table.timestamp('created_at', { useTz: true })
      table.string('block_number')
      table.string('type')
      table.string('account')

      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('event_id').references('id').inTable('events')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
      table.integer('submission_id').references('id').inTable('set_submissions')
      table.integer('subscription_id').references('id').inTable('set_subscriptions')
      table
        .bigInteger('subscription_history_id')
        .references('id')
        .inTable('set_subscription_history')
    })
  }

  public async down() {
    this.schema.dropTable('images_posts')
    this.schema.dropTable('timeline')

    this.schema.alterTable('posts', (table) => {
      table.dropColumn('approved_at')
      table.dropColumn('signature')
      table.renameColumn('parent_post_id', 'parent_comment_id')
    })

    this.schema.renameTable('posts', 'comments')

    this.schema.createTable('posts', (table) => {
      table.bigIncrements('id')
      table.string('address')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      table.text('content')
    })

    this.schema.createTable('images_posts', (table) => {
      table.bigIncrements('id')
      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('image_id').references('id').inTable('images')
    })

    this.schema.createTable('timeline', (table) => {
      table.bigIncrements('id')
      table.timestamp('created_at', { useTz: true })
      table.string('block_number')
      table.string('type')
      table.string('account')

      table.bigInteger('post_id').references('id').inTable('posts')
      table.bigInteger('event_id').references('id').inTable('events')
      table.bigInteger('opepen_id').references('token_id').inTable('opepens')
      table.integer('submission_id').references('id').inTable('set_submissions')
      table.integer('subscription_id').references('id').inTable('set_subscriptions')
      table
        .bigInteger('subscription_history_id')
        .references('id')
        .inTable('set_subscription_history')
    })
  }
}
