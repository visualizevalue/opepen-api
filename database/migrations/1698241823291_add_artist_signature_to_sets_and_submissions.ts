import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {
    this.schema.alterTable('sets', (table) => {
      table.jsonb('artist_signature')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.jsonb('artist_signature')
    })
  }

  public async down() {
    this.schema.alterTable('sets', (table) => {
      table.dropColumn('artist_signature')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.dropColumn('artist_signature')
    })
  }
}
