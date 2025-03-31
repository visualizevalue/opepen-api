import { BaseModel, column, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import SetSubmission from 'App/Models/SetSubmission'
import Account from 'App/Models/Account'

export default class CoCreator extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public setSubmissionId: number

  @column()
  public accountId: number

  @belongsTo(() => SetSubmission, {
    foreignKey: 'setSubmissionId',
  })
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Account, {
    foreignKey: 'accountId',
  })
  public account: BelongsTo<typeof Account>
}
