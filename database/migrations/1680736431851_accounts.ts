import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { ethers } from 'ethers'
import { DateTime } from 'luxon'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.string('address').unique()
      table.string('ens', 2048).nullable()
      table.jsonb('data')
      table.timestamp('updated_at', { useTz: true })
    })

    // Create the default
    this.defer(async (db) => {
      await db.table('accounts').insert({
        address: ethers.constants.AddressZero.toString(),
        updated_at: DateTime.now(),
      })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
