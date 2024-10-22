import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class UpdateDynamicSetImagesCache extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'update:dynamic_set_images_cache'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const dynamicSubmissions = await SetSubmission.query()
      .where('editionType', 'DYNAMIC')
      .whereNotNull('dynamicSetImagesId')

    for (const submission of dynamicSubmissions) {
      await submission.updateDynamicSetImagesCache()
      console.log(`Cache updated: ${submission.name}`)
    }
  }
}
