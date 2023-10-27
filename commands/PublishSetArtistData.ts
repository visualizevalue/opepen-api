import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import SetModel from 'App/Models/Set'
import SetSubmission from 'App/Models/SetSubmission'

export default class PublishSetArtistData extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:publish-artist-data'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Create a set submission for for an existing set'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public submission: string

  public async run() {
    const submission = await SetSubmission.findByOrFail('uuid', this.submission)
    const set = await SetModel.findOrFail(submission.setId)

    set.creator = submission.creator
    set.artistSignature = submission.artistSignature

    await set.save()

    this.logger.info(`Updated set: ${set.id}`)
  }
}
