import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'

export default class TimelineUpdate extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public address: string

  @column()
  public data: object

  @column()
  public hash: string

  @column()
  public hashScheme: string

  @column()
  public signature: string

  @column()
  public signatureScheme: string

  @column()
  public signer: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public account: BelongsTo<typeof Account>

}
