import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'casts'

  public async up () {
    this.schema.alterTable('accounts', table => {
      table.jsonb('farcaster')
    })

    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('address')

      table.jsonb('data')

      table.string('hash')
      table.string('hash_scheme')
      table.string('signature')
      table.string('signature_scheme')
      table.string('signer')

      table.timestamp('created_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)

    this.schema.alterTable('accounts', table => {
      table.dropColumn('farcaster')
    })
  }
}
