import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import JourneyStep from './JourneyStep'

export default class Journey extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public title: string

  @column()
  public owner: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Account, {
    foreignKey: 'owner',
    localKey: 'address',
  })
  public creatorAccount: BelongsTo<typeof Account>

  @hasMany(() => JourneyStep)
  public journeys: HasMany<typeof JourneyStep>
}
