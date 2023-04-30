import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import SetModel from './Set'

export default class Subscription extends BaseModel {
  public static table = 'set_subscriptions'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public setId: number

  @column()
  public address: string

  @column()
  public message: string

  @column()
  public signature: string

  @column({
    prepare: value => JSON.stringify(value),
  })
  public opepenIds: number[]

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => SetModel)
  public set: BelongsTo<typeof SetModel>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>
}
