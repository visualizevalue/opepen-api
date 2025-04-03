import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('submission_id').references('id').inTable('set_submissions').nullable()

      table.dropColumn('name')
      table.dropColumn('artist')
      table.dropColumn('min_subscription_percentage')
      table.dropColumn('edition_1_name')
      table.dropColumn('edition_4_name')
      table.dropColumn('edition_5_name')
      table.dropColumn('edition_10_name')
      table.dropColumn('edition_20_name')
      table.dropColumn('edition_40_name')
      table.dropColumn('edition_1_image_id')
      table.dropColumn('edition_4_image_id')
      table.dropColumn('edition_5_image_id')
      table.dropColumn('edition_10_image_id')
      table.dropColumn('edition_20_image_id')
      table.dropColumn('edition_40_image_id')
      table.dropColumn('created_at')
      table.dropColumn('reveals_at')
      table.dropColumn('submitted_opepen')
      table.dropColumn('reveal_block_number')
      table.dropColumn('description')
      table.dropColumn('reveal_strategy')
      table.dropColumn('submission_stats')
      table.dropColumn('rounded_preview')
      table.dropColumn('edition_type')
      table.dropColumn('artist_signature')
      table.dropColumn('creator')
      table.dropColumn('dynamic_preview_image_id')
      table.dropColumn('notification_sent_at')
      table.dropColumn('dynamic_set_images_id')
    })

    this.defer(async (db) => {
      const submissions = await db.from('set_submissions').whereNotNull('set_id')

      for (const submission of submissions) {
        const set = await db.from('sets').where('id', submission.set_id).first()
        if (!set) continue

        await db.from('sets').where('id', set.id).update({ submission_id: submission.id })
      }
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('submission_id')

      table.string('name')
      table.string('artist')
      table.integer('min_subscription_percentage')
      table.string('edition_1_name')
      table.string('edition_4_name')
      table.string('edition_5_name')
      table.string('edition_10_name')
      table.string('edition_20_name')
      table.string('edition_40_name')
      table.bigInteger('edition_1_image_id')
      table.bigInteger('edition_4_image_id')
      table.bigInteger('edition_5_image_id')
      table.bigInteger('edition_10_image_id')
      table.bigInteger('edition_20_image_id')
      table.bigInteger('edition_40_image_id')
      table.timestamp('created_at', { useTz: true })
      table.timestamp('reveals_at', { useTz: true })
      table.jsonb('submitted_opepen')
      table.string('reveal_block_number')
      table.text('description')
      table.string('reveal_strategy')
      table.jsonb('submission_stats')
      table.boolean('rounded_preview')
      table.string('edition_type')
      table.jsonb('artist_signature')
      table.string('creator').references('address').inTable('accounts')
      table.string('dynamic_preview_image_id')
      table.timestamp('notification_sent_at', { useTz: true }).nullable()
      table.integer('dynamic_set_images_id')
    })
  }
}
