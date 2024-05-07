import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class ComputeOptIns extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:compute-opt-ins'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Update & validate the statistics of a set submission (opt ins, demand)'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public submission: string

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    if (this.submission == 'all') {
      const submissions = await SetSubmission.query().orderBy('id')

      for (const submission of submissions) {
        await this.compute(submission)
      }
    } else {
      await this.compute(await SetSubmission.findByOrFail('uuid', this.submission))
    }
  }

  private async compute (submission) {
    await submission.updateAndValidateOpepensInSet()

    console.log(`submission #${submission.name} counts:`, submission.submissionStats)
  }
}
