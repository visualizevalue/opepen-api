import { DateTime } from 'luxon'
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected imagesTable = 'images'
  protected aiImagesTable = 'ai_images'

  public async up () {
    this.schema.createTable(this.imagesTable, (table) => {
      table.bigIncrements('id')
      table.uuid('uuid').unique()

      table.jsonb('versions').nullable()

      table.timestamp('created_at', { useTz: true })
    })

    this.schema.alterTable(this.aiImagesTable, (table) => {
      table.bigInteger('image_id').references('id').inTable(this.imagesTable)
    })

    // Migrate images
    this.defer(async (db) => {
      const aiImages = await db.query().from(this.aiImagesTable).select('*')

      for (const image of aiImages) {
        const inserts = await db.table(this.imagesTable).returning(['id']).insert({
          uuid: image.uuid,
          versions: image.versions,
          created_at: DateTime.now(),
        })

        await db.from(this.aiImagesTable)
          .where('uuid', image.uuid)
          .update({ image_id: inserts[0].id })
      }

      this.schema.alterTable(this.aiImagesTable, (table) => {
        table.dropColumn('versions')
      })
    })
  }

  public async down () {
    this.schema.alterTable(this.aiImagesTable, (table) => {
      table.dropColumn('image_id')
      table.jsonb('versions').nullable()
    })

    this.schema.dropTable(this.imagesTable)
  }
}
