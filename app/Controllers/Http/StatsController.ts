import StatsService from "App/Services/Stats"

export default class SetSubmissionsController {
  public async show () {
    return await StatsService.show()
  }
}
