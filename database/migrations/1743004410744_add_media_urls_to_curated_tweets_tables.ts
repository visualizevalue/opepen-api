import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddMediaUrlsToCuratedTweetsTables extends BaseSchema {
  protected tableName = 'curated_tweets'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.jsonb('media_urls').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('media_urls')
    })
  }
}
