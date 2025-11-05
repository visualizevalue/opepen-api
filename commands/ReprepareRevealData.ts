import fs from 'fs'
import path from 'path'
import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class ReprepareRevealData extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'reveal:reprepare'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Re-prepare reveal data for a submission without changing the reveal block'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string({ description: 'Submission ID' })
  public submissionId: string

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')
    const { default: Reveal } = await import('App/Services/Metadata/Reveal/Reveal')

    const submission = await SetSubmission.query()
      .where('id', this.submissionId)
      .firstOrFail()

    if (!submission.revealBlockNumber) {
      this.logger.error('Submission does not have a reveal block number set')
      return
    }

    this.logger.info(`Re-preparing reveal data for ${submission.name} (${submission.id})`)
    this.logger.info(`Reveal block: ${submission.revealBlockNumber}`)

    // Call prepareData directly
    const reveal = new Reveal()
    await reveal['prepareData'](submission)

    fs.writeFileSync(this.inputPath(submission.id), submission.revealSubmissionsInput)

    this.logger.info(`Successfully re-prepared reveal data`)
    this.logger.info(`CID: ${submission.revealSubmissionsInputCid}`)
  }

  private inputPath(submissionId: number) {
    return path.join(__dirname, `../app/Services/Metadata/Reveal/data/${submissionId}.json`)
  }
}
