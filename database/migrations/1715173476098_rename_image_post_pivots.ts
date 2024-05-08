import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up () {
    this.schema.renameTable('images_posts', 'image_post')
  }

  public async down () {
    this.schema.renameTable('image_post', 'images_posts')
  }
}
