import { DateTime } from "luxon"
import { SetModel } from "App/Models"
import SetSubmission from "App/Models/SetSubmission"
import SubscriptionHistory from "App/Models/SubscriptionHistory"

export type Stats = {
  submissions: {
    sets: number
    images: number
  }
  optIns: number
  revealed: {
    opepen: number
    sets: number
  }
}

class StatsService {
  private stats: Stats
  private lastUpdated: number = 0

  public async show (): Promise<Stats> {
    // If last updated longer than 10 minutes ago // 60 * 10
    if (this.lastUpdated < (DateTime.now().toUnixInteger() - 10)) {
      await this.computeStats()
    }

    return this.stats
  }

  private async computeStats () {
    const [
      submissions,
      printSubmissions,
      optIns,
      sets,
    ] = await Promise.all([
      SetSubmission.query().count('id'),
      SetSubmission.query().where('edition_type', 'PRINT').count('id'),
      SubscriptionHistory.query().sum('opepen_count'),
      SetModel.query().whereNotNull('submissionId').count('id'),
    ])

    const setsCount: number = parseInt(sets[0].$extras.count)
    const submissionsCount: number = parseInt(submissions[0].$extras.count)
    const printSubmissionsCount: number = parseInt(printSubmissions[0].$extras.count)
    const dynamicSubmissionsCount: number = submissionsCount - printSubmissionsCount
    const submittedImagesCount: number = dynamicSubmissionsCount * 80 + printSubmissionsCount * 6

    this.stats = {
      submissions: {
        sets: submissionsCount,
        images: submittedImagesCount,
      },
      optIns: parseInt(optIns[0].$extras.sum),
      revealed: {
        opepen: setsCount * 80,
        sets: setsCount,
      },
    }

    this.lastUpdated = DateTime.now().toUnixInteger()
  }

}

export default new StatsService()
