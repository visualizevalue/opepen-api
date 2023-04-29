import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Set from './Set'
import Opepen from './Opepen'

export default class Subscription extends BaseModel {
  public static table = 'set_subscriptions'

  @column()
  public setId: number

  @column()
  public opepenId: bigint

  @column()
  public address: string

  @column()
  public message: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Set)
  public set: BelongsTo<typeof Set>

  @belongsTo(() => Opepen)
  public opepen: BelongsTo<typeof Opepen>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>
}
