import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class CuratedTweets extends BaseSchema {
  protected tableName = 'curated_tweets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('tweet_id').notNullable().unique()
      table.string('author_id').notNullable()
      table.string('username').nullable()
      table.string('name').nullable()
      table.string('profile_image_url').nullable()
      table.text('text').notNullable()
      table.timestamp('tweet_created_at', { useTz: true }).nullable()

      table.string('media_url').nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
