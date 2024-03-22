import { BaseCommand } from '@adonisjs/core/build/standalone'
import { delay } from 'App/Helpers/time'
import provider from 'App/Services/RPCProvider'

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

    this.logger.info(`Waiting 5s to reveal`)

    await delay(5000)

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
  }
}
