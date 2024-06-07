import { BaseCommand } from '@adonisjs/core/build/standalone'
import { DateTime } from 'luxon'

export default class ArchiveStaleSetSubmissions extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'submissions:archive_stale'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const submissions = await SetSubmission.query()
      .withScopes(scopes => scopes.live())
      .whereNull('archivedAt') // No need to touch archived items
      .whereNull('setId') // Leave revealed submissions alone
      .whereNull('revealsAt') // Leave currently running submissions alone
      // Anything without any activity in the last 48 hours, bye bye
      .where(query => {
        query.where('lastOptInAt', '<=', DateTime.now().minus({ hours: 48 }).toISO())
        query.orWhereNull('lastOptInAt')
        query.orWhereJsonPath('submission_stats', '$.holders.total', '<', 9)
      })
      // Give newly approved sets ample time...
      .where('approvedAt', '<=', DateTime.now().minus({ hours: 48 }).toISO())

    for (const submission of submissions) {
      await submission.clearOptIns()

      submission.archivedAt = DateTime.now()
      await submission.save()

      this.logger.info(`Cleaned and archived ${submission.name} (#${submission.id})`)
    }
  }
}
