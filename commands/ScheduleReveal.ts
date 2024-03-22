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

    this.logger.info(`Reveals to schedule: ${toSchedule.length}`)

    for (const submission of toSchedule) {
      try {
        await submission.scheduleReveal()
        this.logger.info(`Scheduled reveal of submission ${submission.uuid} to block ${submission.revealBlockNumber}`)

        // Postpone other tokens
        const toPostpone = await SetSubmission.query()
          .whereNotNull('revealsAt')
          .whereNull('setId')
          .whereNot('id', submission.id)

        for (const submission of toPostpone) {
          if (! submission.revealsAt) continue
          submission.revealsAt = submission.revealsAt.plus({ hours: 12 })
          await submission.save()
          this.logger.info(`Postponed ${submission.name} by 12 hours`)
        }
      } catch (e) {
        this.logger.error(`Something went wrong during reveal schedule: ${e}`)
      }
    }

  }
}
