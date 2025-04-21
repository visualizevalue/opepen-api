import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'participation_images'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('set_submission_id')
        .unsigned()
        .references('id')
        .inTable('set_submissions')
        .onDelete('CASCADE')

      table
        .bigInteger('image_id')
        .unsigned()
        .references('id')
        .inTable('images')
        .onDelete('CASCADE')

      table
        .string('creator_address', 255)
        .references('address')
        .inTable('accounts')
        .onDelete('CASCADE')

      table.timestamp('deleted_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
