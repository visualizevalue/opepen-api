import { DateTime } from 'luxon'
import { BaseCommand } from '@adonisjs/core/build/standalone'

const STAGE_BUFFER_MINUTES = 20

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
    await this.setup()
    await this.archiveFailed()
    await this.stageNew()
  }

  // Commit routes before we can read them
  private async setup () {
    const Router = this.application.container.use('Adonis/Core/Route')
    Router.commit()
  }

  // We stage a new set if one with sufficient demand is available
  private async stageNew () {
    const { default: SetSubmission, OPT_IN_HOURS } = await import('App/Models/SetSubmission')
    const { default: BotNotifications } = await import('App/Services/BotNotifications')

    const currentlyStaged = await SetSubmission.query()
      .where('starredAt', '>=',  DateTime.now().minus({ hours: OPT_IN_HOURS, minutes: STAGE_BUFFER_MINUTES }).toISO())
      .orderBy('starredAt', 'desc')
      .first()

    if (currentlyStaged) {
      this.logger.info(`A set is already staged or in buffer: ${currentlyStaged.name}`)
      return
    }

    const toStage = await SetSubmission.query()
      .withScopes(scopes => scopes.live())
      .whereNull('setId')
      .whereNull('starredAt')
      .whereNull('archivedAt')
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

  // We stage a new set if one with sufficient demand is available
  private async archiveFailed () {
    const { default: SetSubmission, OPT_IN_HOURS } = await import('App/Models/SetSubmission')
    const { default: BotNotifications } = await import('App/Services/BotNotifications')

    const previouslyStaged = await SetSubmission.query()
      .whereNotNull('starredAt')
      .where('starredAt', '<',  DateTime.now().minus({ hours: OPT_IN_HOURS }).toISO())
      .whereNull('revealsAt')
      .whereNull('archivedAt')
      .orderBy('starredAt', 'desc')
      .first()

    if (! previouslyStaged) {
      this.logger.info(`No set to destage.`)
      return
    }

    this.logger.info(`Destaging/archiving ${previouslyStaged.name}`)

    previouslyStaged.archivedAt = DateTime.now()
    await previouslyStaged.save()

    await BotNotifications?.consensusFailed(previouslyStaged)
  }
}

