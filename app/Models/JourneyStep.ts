import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import { prepareBigIntJson } from 'App/Helpers/bigints'
import Journey from './Journey'
import AiImage from './AiImage'
import { OpepenOptions } from 'App/Services/OpepenSVG/OpepenGenerator'

type StepConfig = {
  opepen?: OpepenOptions
}

export default class JourneyStep extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: bigint

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: Journey) {
    model.uuid = uuid()
  }

  @column({ serializeAs: null })
  public journeyId: bigint

  @column()
  public prompt: string

  @column({
    prepare: prepareBigIntJson,
  })
  public config: StepConfig

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => Journey)
  public journey: BelongsTo<typeof Journey>

  @hasMany(() => AiImage, {
    serializeAs: 'ai_images'
  })
  public aiImages: HasMany<typeof AiImage>
}
