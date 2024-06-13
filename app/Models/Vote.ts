import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Image from './Image'

export default class Vote extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public address: string

  @column()
  public points: number

  @column()
  public imageId: bigint

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

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

}
