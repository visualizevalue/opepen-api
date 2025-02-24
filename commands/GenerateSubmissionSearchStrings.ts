import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class GenerateSubmissionSearchStrings extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'generate:submission_search_strings'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  public async run() {
    const { default: SetSubmission } = await import('App/Models/SetSubmission')

    const submissions = await SetSubmission.all()

    for (const submission of submissions) {
      await submission.updateSearchString()
    }
  }
}
