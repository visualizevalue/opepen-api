import { column } from '@ioc:Adonis/Lucid/Orm'
import SetBaseModel from 'App/Models/SetBaseModel'

export default class SetDataModel extends SetBaseModel {
  public static table = 'sets'

  @column({ serializeAs: null })
  public replacedSubmissionId: number
}
