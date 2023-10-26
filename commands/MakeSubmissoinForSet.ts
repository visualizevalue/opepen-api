import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/Set'
import SetSubmission from 'App/Models/SetSubmission'
import { DateTime } from 'luxon'

export default class MakeSubmissoinForSet extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:generate-submission'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Create a set submission for for an existing set'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  @args.string()
  public creator: string

  public async run() {
    const existingSubmission = await SetSubmission.findBy('set_id', this.set)
    const set = await SetModel.findOrFail(this.set)
    const creator = await Account.firstOrCreate({ address: this.creator.toLowerCase() })

    if (
      existingSubmission &&
      set.name === existingSubmission.name
    ) {
      this.logger.warning(`Set ${set.id} is already published ("${existingSubmission.uuid}")`)
      return
    }

    const submission = await SetSubmission.create({
      creator: creator.address,
      artist: set.artist,
      name: set.name,
      description: set.description,
      editionType: set.editionType,
      edition_1Name: set.edition_1Name,
      edition_4Name: set.edition_4Name,
      edition_5Name: set.edition_5Name,
      edition_10Name: set.edition_10Name,
      edition_20Name: set.edition_20Name,
      edition_40Name: set.edition_40Name,
      edition_1ImageId: set.edition_1ImageId,
      edition_4ImageId: set.edition_4ImageId,
      edition_5ImageId: set.edition_5ImageId,
      edition_10ImageId: set.edition_10ImageId,
      edition_20ImageId: set.edition_20ImageId,
      edition_40ImageId: set.edition_40ImageId,
      starredAt: DateTime.now(),
      publishedAt: set.revealsAt,
      setId: set.id,
    })
    this.logger.info(`Created new submission: ${submission.uuid}`)
  }
}
