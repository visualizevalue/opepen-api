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
            SELECT creator as address FROM set_submissions WHERE shadowed_at IS NULL
            UNION
            SELECT a.address
            FROM set_submissions s
            JOIN co_creators c ON s.id = c.set_submission_id
            JOIN accounts a ON a.id = c.account_id
            WHERE s.shadowed_at IS NULL
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
