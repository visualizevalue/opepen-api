import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('votes_count').index()
    })

    this.defer(async db => {
      const accounts = await db.rawQuery(`select address, count(*) as count from votes group by address`)

      for (const account of accounts.rows) {
        await db.rawQuery(`update accounts set "votes_count" = ${account.count} where "address" = '${account.address}'`)
      }
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('votes_count')
    })
  }
}
