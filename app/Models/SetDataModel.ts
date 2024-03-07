import { DateTime } from 'luxon'
import { column } from '@ioc:Adonis/Lucid/Orm'
import SetBaseModel from './SetBaseModel'

export default class SetDataModel extends SetBaseModel {
  public static table = 'sets'

  @column()
  public revealStrategy: string

  @column({ serializeAs: null })
  public replacedSubmissionId: number

  @column()
  public notificationSentAt: DateTime
}
