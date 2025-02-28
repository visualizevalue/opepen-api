import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'

const STAGE_BUFFER_MINUTES = 10

export default class StageSet extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:stage'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission, OPT_IN_HOURS } = await import('App/Models/SetSubmission')
    const { default: BotNotifications } = await import('App/Services/BotNotifications')

    /**
     * Commit routes before we can read them
     */
    const Router = this.application.container.use('Adonis/Core/Route')
    Router.commit()

    const currentlyStaged = await SetSubmission.query()
      .where('starredAt', '>=',  DateTime.now().minus({ hours: OPT_IN_HOURS, minutes: STAGE_BUFFER_MINUTES }).toISO())
      .orderBy('starredAt')
      .first()

    if (currentlyStaged) {
      this.logger.info(`A set is already staged: ${currentlyStaged.name}`)
      return
    }

    const toStage = await SetSubmission.query()
      .withScopes(scopes => scopes.live())
      .whereNull('setId')
      .whereNull('starredAt')
      .whereJsonPath('submission_stats', '$.demand.total', '>', 40)
      .orderByRaw(`"submission_stats" -> 'demand' -> 'total' DESC NULLS LAST`)
      .first()

    if (! toStage) {
      this.logger.info(`No set to stage.`)
      return
    }

    this.logger.info(`Staging ${toStage.name} with ${toStage.submissionStats.demand.total} demand`)

    toStage.starredAt = DateTime.now()
    await toStage.save()

    await toStage.notify('NewCuratedSubmission', true)
    await BotNotifications?.newStagedSubmission(toStage)
  }
}
