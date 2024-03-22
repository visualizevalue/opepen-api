import { BaseCommand } from '@adonisjs/core/build/standalone'
import provider from 'App/Services/RPCProvider'
import { DateTime } from 'luxon'

export default class ExecuteReveal extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'reveal:execute'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Execute pending reveals'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const currentBlock = await provider.getBlockNumber()

    const toReveal = await SetSubmission.query()
      .whereNotNull('revealBlockNumber')
      .where('revealBlockNumber', '<=', currentBlock.toString())
      .whereNull('setId')

    this.logger.info(`Reveals to execute: ${toReveal.length}`)

    for (const submission of toReveal) {
      try {
        await submission.reveal()

        this.logger.info(`Executed reveal for submission ${submission.name}`)
      } catch (e) {
        this.logger.error(`Reveal execution for submission ${submission.name} failed: ${e}`)
        console.error(e)
      }
    }

    const toPostpone = await SetSubmission.query()
      .whereNotNull('revealsAt')
      .whereNull('setId')
      .where('revealsAt', '<', DateTime.now().plus({ hours: 12 }).toISO())

    for (const submission of toPostpone) {
      if (! submission.revealsAt) continue
      submission.revealsAt = submission.revealsAt.plus({ hours: 12 })
      await submission.save()
      this.logger.info(`Postponed ${submission.name} by 12 hours`)
    }
  }
}
