import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import SetModel from 'App/Models/SetModel'
import SetSubmission from 'App/Models/SetSubmission'

export default class StageSetSubmission extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'sets:stage_submission'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Stage a set submission for opt in'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public submission: string

  @args.string()
  public set: string

  public async run() {
    const submission = await SetSubmission.findByOrFail('uuid', this.submission)
    const set = await SetModel.findOrFail(this.set)

    if (set.name) {
      this.logger.warning(`Set ${set.id} is already published ("${set.name}")`)
    }

    if (! await this.prompt.confirm(`Do you really want to publish ${submission.name} to set ${set.id}`)) {
      this.logger.info('Aborting...')
      return
    }

    const hours: string = await this.prompt.ask(`How many hours should the opt in run for?`, { default: '48' })

    await submission.publish(set.id, parseInt(hours))
  }
}
