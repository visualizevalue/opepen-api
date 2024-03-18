import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class ScheduleReveal extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'reveal:schedule'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Set the reveal block for all submissions that should reveal'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const toSchedule = await SetSubmission.query()
      .whereNull('revealBlockNumber')
      .whereNotNull('revealsAt')
      .where('revealsAt', '<=', DateTime.now().toISO())

    for (const submission of toSchedule) {
      await submission.scheduleReveal()

      this.logger.info(`Scheduled reveal of submission ${submission.uuid} to block ${submission.revealBlockNumber}`)
    }
  }
}
