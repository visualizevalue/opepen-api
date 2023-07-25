import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import SetModel from 'App/Models/Set'

export default class ComputeHoldersAtSetReveal extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'set:compute-reveal-holders'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Compute the number of unique holders at the time of the drop of a set'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public set: string

  public async run() {
    if (this.set == 'all') {
      const sets = await SetModel.query().orderBy('id')

      for (const set of sets) {
        await this.compute(set)
      }
    } else {
      await this.compute(await SetModel.findOrFail(this.set))
    }
  }

  private async compute (set: SetModel) {
    await set.computeTotalHoldersAtReveal()
  }
}
