import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'ai_images'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')
      table.uuid('uuid').unique()

      table.bigInteger('journey_step_id').references('id').inTable('journey_steps')
      table.bigInteger('model_id').references('id').inTable('ai_models')

      table.jsonb('data')

      table.timestamp('created_at', { useTz: true })
      table.timestamp('generated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
