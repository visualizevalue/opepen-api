import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'

export default class UpdateAccountSetCounts extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'update:account_set_counts'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Account } = await import('App/Models/Account')

    const accounts = await Account.query()
      .whereIn('address', Database.rawQuery(`
        SELECT address
        FROM (
            SELECT creator as address FROM set_submissions WHERE approved_at IS NOT NULL
            UNION
            SELECT co_creator_1 FROM set_submissions WHERE co_creator_1 IS NOT NULL AND approved_at IS NOT NULL
            UNION
            SELECT co_creator_2 FROM set_submissions WHERE co_creator_2 IS NOT NULL AND approved_at IS NOT NULL
            UNION
            SELECT co_creator_3 FROM set_submissions WHERE co_creator_3 IS NOT NULL AND approved_at IS NOT NULL
            UNION
            SELECT co_creator_4 FROM set_submissions WHERE co_creator_4 IS NOT NULL AND approved_at IS NOT NULL
            UNION
            SELECT co_creator_5 FROM set_submissions WHERE co_creator_5 IS NOT NULL AND approved_at IS NOT NULL
        ) AS artist_addresses
      `))

    this.logger.info(`To update: ${accounts.length}`)

    let count = 0
    for (const account of accounts) {
      await account.updateSetSubmissionsCount()

      count ++
      if (count % 50 === 0) {
        this.logger.info(`Updated: ${count}`)
      }
    }
    this.logger.info(`Updated: ${count}`)
  }
}
