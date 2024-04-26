import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class RestorePastValidOptIns extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'restore:past_valid_opt_ins'

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
    const { default: Subscription } = await import('App/Models/Subscription')
    const { default: SubscriptionHistory } = await import('App/Models/SubscriptionHistory')

    const preV2 = await SetSubmission.query().whereIn('revealStrategy', ['v1', 'v2']).orderBy('setId')

    for (const submission of preV2) {
      const subscriptions = await Subscription.query().where('submissionId', submission.id)

      for (const subscription of subscriptions) {
        const lastHistoryItem = await SubscriptionHistory.query()
          .where('subscriptionId', subscription.id.toString())
          .orderBy('id', 'desc')
          .first()

        subscription.opepenIds = lastHistoryItem?.opepenIds || []

        await subscription.save()
      }

      await submission.cleanSubscriptionsAndStats()
      this.logger.info(`Updated ${subscriptions.length} opt ins for ${submission.name} and calculated clean stats`)
    }
  }
}
