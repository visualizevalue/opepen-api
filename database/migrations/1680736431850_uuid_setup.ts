import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class SetupExtensions extends BaseSchema {
  public up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  }

  public down() {
    this.schema.raw('DROP EXTENSION IF EXISTS "uuid-ossp"')
  }
}
