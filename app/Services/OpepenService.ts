import { SetModel } from 'App/Models'

export class OpepenService {
  private CACHE: {
    setsCount: number
    sets: SetModel[]
  } = {
    setsCount: 0,
    sets: [],
  }

  public async listSets(force: boolean = false) {
    const countSetsResult = await SetModel.query().whereNotNull('submissionId').count('id')
    const setsCount = countSetsResult[0].$extras.count

    if (!force && setsCount === this.CACHE.setsCount) {
      return this.CACHE.sets
    }

    const sets = await SetModel.query()
      .preload('submission')
      .whereNotNull('submissionId')
      .orderBy('id')

    this.CACHE.sets = sets
    this.CACHE.setsCount = setsCount

    return this.CACHE.sets
  }
}

export default new OpepenService()
