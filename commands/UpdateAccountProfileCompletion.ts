import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class UpdateAccountProfileCompletion extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'update:account_profile_completion'

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
      .whereNotNull('ens')
      .orWhereNotNull('name')
      .orWhereNotNull('pfpImageId')
      .orWhereNotNull('coverImageId')
      .orWhereNotNull('tagline')
      .orWhereNotNull('bio')
      .orWhereNotNull('quote')
      .orWhereNotNull('socials')

    this.logger.info(`To update: ${accounts.length}`)

    let count = 0
    for (const account of accounts) {
      await account.updateProfileCompletion()
      count++

      if (count % 1000 === 0) {
        this.logger.info(`Updated: ${count}`)
      }
    }
    this.logger.info(`Updated: ${count}`)
  }
}
