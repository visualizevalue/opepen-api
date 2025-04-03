import { v4 as uuid } from 'uuid'
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('uuid').unique()
    })

    this.defer(async (db) => {
      const posts = await db.table('posts')

      for (const post of posts) {
        await db.query().from('posts').where('id', post.id).update({
          uuid: uuid(),
        })
      }
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('uuid')
    })
  }
}
