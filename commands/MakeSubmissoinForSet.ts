import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
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

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    console.log(this.set)
    const existingSubmission = await SetSubmission.query().where('set_id', this.set).orderBy('created_at', 'desc').first()
    const set = await Database.query().from('sets').where('id', this.set).first()

    if (existingSubmission) {
      existingSubmission.creator = set.creator
      existingSubmission.artist = set.artist
      existingSubmission.name = set.name
      existingSubmission.description = set.description
      existingSubmission.editionType = set.editionType
      existingSubmission.edition_1Name = set.edition_1Name
      existingSubmission.edition_4Name = set.edition_4Name
      existingSubmission.edition_5Name = set.edition_5Name
      existingSubmission.edition_10Name = set.edition_10Name
      existingSubmission.edition_20Name = set.edition_20Name
      existingSubmission.edition_40Name = set.edition_40Name
      existingSubmission.edition_1ImageId = set.edition_1ImageId
      existingSubmission.edition_4ImageId = set.edition_4ImageId
      existingSubmission.edition_5ImageId = set.edition_5ImageId
      existingSubmission.edition_10ImageId = set.edition_10ImageId
      existingSubmission.edition_20ImageId = set.edition_20ImageId
      existingSubmission.edition_40ImageId = set.edition_40ImageId
      existingSubmission.starredAt = set.revealsAt
      existingSubmission.publishedAt = set.revealsAt

      await existingSubmission.save()

      return
    }

    const submission = await SetSubmission.create({
      creator: set.creator,
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
