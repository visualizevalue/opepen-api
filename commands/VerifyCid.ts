import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import CID from 'App/Services/CID'

export default class VerifyCid extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'verify:cid'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public uuid: string

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const submission = await SetSubmission.query().where('uuid', this.uuid).firstOrFail()

    const existingCID = submission.revealSubmissionsInputCid
    // const blob = submission.revealSubmissionsInput
    const data = JSON.parse(submission.revealSubmissionsInput)

    const computedCID = await await CID.getJsonCID(data)
    // const computedViaStringCID = await await CID.getJsonCID(data)

    this.logger.info(`Existing:    ${existingCID}`)
    this.logger.info(`Computed:    ${computedCID}`)
    this.logger.info(`Computed V1: ${CID.toV1(`QmbLBEojBLsjvWQctciGhDCtxxfZMWhtYQ4kjfXGxfEdze`)}`)
  }
}
