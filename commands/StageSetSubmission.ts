import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import SetModel from 'App/Models/Set'
import SetSubmission from 'App/Models/SetSubmission'
import { DateTime } from 'luxon'

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

    await submission.load('creatorAccount')

    set.name = submission.name
    set.description = submission.description
    set.artist = submission.creatorAccount.display
    set.edition_1Name = submission.edition_1Name
    set.edition_4Name = submission.edition_4Name
    set.edition_5Name = submission.edition_5Name
    set.edition_10Name = submission.edition_10Name
    set.edition_20Name = submission.edition_20Name
    set.edition_40Name = submission.edition_40Name
    set.edition_1ImageId = submission.edition_1ImageId
    set.edition_4ImageId = submission.edition_4ImageId
    set.edition_5ImageId = submission.edition_5ImageId
    set.edition_10ImageId = submission.edition_10ImageId
    set.edition_20ImageId = submission.edition_20ImageId
    set.edition_40ImageId = submission.edition_40ImageId

    const hours: string = await this.prompt.ask(`How many hours should the opt in run for?`, { default: '48' })
    set.revealsAt = DateTime.now()
      .plus({ hours: parseInt(hours) + 1 })
      .set({ minute: 0, second: 0, millisecond: 0 })

    await set.save()

    submission.setId = set.id
    await submission.save()
  }
}
