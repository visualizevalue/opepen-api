import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import { MaxReveal } from './types'

export default class Subscription extends BaseModel {
  public static table = 'set_subscriptions'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public submissionId: number

  @column()
  public address: string

  @column()
  public delegatedBy: string

  @column()
  public message: string

  @column()
  public signature: string

  @column()
  public comment: string

  @column({
    prepare: value => JSON.stringify(value),
  })
  public opepenIds: string[]

  @column({
    prepare: value => JSON.stringify(value),
  })
  public maxReveals: MaxReveal

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => SetSubmission, {
    foreignKey: 'submissionId',
  })
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>
}
