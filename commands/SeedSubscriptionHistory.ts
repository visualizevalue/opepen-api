import { BaseCommand } from '@adonisjs/core/build/standalone'
import SubscriptionHistory from 'App/Models/SubscriptionHistory'

export default class SeedSubscriptionHistory extends BaseCommand {
  public static commandName = 'seed:subscription_history'
  public static description = 'Seed previous ids and counts in subscription history'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const histories = await SubscriptionHistory.query()
      .orderBy('address')
      .orderBy('submission_id')
      .orderBy('created_at')

    let updated = 0
    let previousHistoryMap = new Map()

    for (const history of histories) {
      const key = `${history.address}-${history.submissionId}`
      const previousHistory = previousHistoryMap.get(key)

      if (previousHistory) {
        history.previousOpepenIds = previousHistory.opepenIds
        history.previousOpepenCount = previousHistory.opepenCount
        await history.save()
        updated++
      } else if (!history.previousOpepenIds) {
        history.previousOpepenIds = []
        history.previousOpepenCount = 0
        await history.save()
        updated++
      }

      previousHistoryMap.set(key, {
        opepenIds: history.opepenIds,
        opepenCount: history.opepenCount,
      })
    }

    this.logger.success(`Successfully updated ${updated} subscription history records`)
  }
}
