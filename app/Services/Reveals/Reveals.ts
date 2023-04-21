export default class RevealService {
  public static async getReveals(id: string) {
    return import(`./winners/${id}.json`)
  }
}
