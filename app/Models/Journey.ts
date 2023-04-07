import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column, HasMany, hasMany, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import JourneyStep from './JourneyStep'
import AiImage from './AiImage'

export default class Journey extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: bigint

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: Journey) {
    model.uuid = uuid()
  }

  @column()
  public title: string

  @column()
  public owner: string

  @column({ serializeAs: null })
  public mainImageId: bigint

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Account, {
    foreignKey: 'owner',
    localKey: 'address',
  })
  public ownerAccount: BelongsTo<typeof Account>

  @hasOne(() => AiImage, {
    foreignKey: 'id',
    localKey: 'mainImageId',
  })
  public mainImage: HasOne<typeof AiImage>

  @hasMany(() => JourneyStep)
  public steps: HasMany<typeof JourneyStep>
}
