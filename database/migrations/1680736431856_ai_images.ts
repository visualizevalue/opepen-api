import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ai_images'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.uuid('uuid').unique()

      table.bigInteger('model_id').index('ai_images_model_id')
      table.foreign('model_id').references('ai_models.id')

      table.jsonb('data')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('generated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
