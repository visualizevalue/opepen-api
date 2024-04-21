import { BaseCommand, args } from '@adonisjs/core/build/standalone'

export default class CleanSetSubmissions extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:clean-submissions'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Force update opepen tokens and ownership'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  public async run() {
    const { default: SetModel } = await import('App/Models/SetModel')

    if (this.set == 'all') {
      const sets = await SetModel.query().preload('submission').orderBy('id')

      for (const set of sets) {
        await this.compute(set)
      }
    } else {
      await this.compute(await SetModel.findOrFail(this.set))
    }
  }

  private async compute (set) {
    await set.submission.cleanSubscriptionsAndStats()

    console.log(`Set #${set.id} counts:`, set.submission.submissionStats)
  }
}
