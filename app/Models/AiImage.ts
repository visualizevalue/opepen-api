import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { prepareBigIntJson } from 'App/Helpers/bigints'
import JourneyStep from './JourneyStep'
import { Keyable } from 'App/Helpers/types'
import Image from './Image'

export default class AiImage extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: bigint

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: AiImage) {
    model.uuid = uuid()
  }

  @column({ serializeAs: null })
  public journeyStepId: bigint|null

  @column({ serializeAs: null })
  public modelId: number

  @column({ serializeAs: null })
  public imageId: bigint

  @column({
    prepare: prepareBigIntJson,
  })
  public data: Keyable

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime()
  public generatedAt: DateTime

  @belongsTo(() => JourneyStep)
  public journeyStep: BelongsTo<typeof JourneyStep>

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

  static async fromURI (url: string, data: object = {}): Promise<AiImage> {
    const image = await Image.create({ versions: { sm: true }})
    await image.fillImageFromURI(url)

    return AiImage.create({
      ...data,
      imageId: image.id,
    })
  }
}
