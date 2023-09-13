import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up () {
    this.schema.alterTable('sets', (table) => {
      table.string('edition_type').defaultTo('PRINT')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.string('edition_type').defaultTo('PRINT')
    })

    this.defer(async () => {
      await this.db.from('sets').where('is_dynamic', true).update({ edition_type: 'DYNAMIC' })
      await this.db.from('set_submissions').where('is_dynamic', true).update({ edition_type: 'DYNAMIC' })

      this.schema.alterTable('sets', table => {
        table.dropColumn('is_dynamic')
      })
      this.schema.alterTable('set_submissions', table => {
        table.dropColumn('is_dynamic')
      })
    })
  }

  public async down () {
    this.schema.alterTable('sets', (table) => {
      table.boolean('is_dynamic')
    })
    this.schema.alterTable('set_submissions', (table) => {
      table.boolean('is_dynamic')
    })

    this.defer(async () => {
      await this.db.from('sets').where('edition_type', 'DYNAMIC').update({ is_dynamic: true })
      await this.db.from('set_submissions').where('edition_type', 'DYNAMIC').update({ is_dynamic: true })

      this.schema.alterTable('sets', (table) => {
        table.dropColumn('edition_type')
      })
      this.schema.alterTable('set_submissions', (table) => {
        table.dropColumn('edition_type')
      })
    })
  }
}
