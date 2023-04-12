import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, beforeCreate, BelongsTo, belongsTo, column, computed } from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { prepareBigIntJson } from 'App/Helpers/bigints'
import JourneyStep from './JourneyStep'
import { Keyable } from 'App/Helpers/types'
import { toDriveFromURI } from 'App/Helpers/drive'
import EnhancedSRGANUpscaler from 'App/Services/Upscalers/EnhancedSRGANUpscaler'

type ImageVersions = {
  lg?: boolean
}

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
  public journeyStepId: bigint

  @column({ serializeAs: null })
  public modelId: number

  @column({
    prepare: prepareBigIntJson,
  })
  public data: Keyable

  @column({
    consume: value => value || {},
  })
  public versions: ImageVersions

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime()
  public generatedAt: DateTime

  @computed()
  public get uri (): string {
    return `${Env.get('CDN_URL')}/images/${this.uuid}.png`
  }

  @belongsTo(() => JourneyStep)
  public journeyStep: BelongsTo<typeof JourneyStep>

  async fillImageFromURI (url: string): Promise<AiImage> {
    await toDriveFromURI(url, this.uuid)
    this.generatedAt = DateTime.now()
    await this.save()

    return this
  }

  async upscale (): Promise<void> {
    const data = await Drive.get(`images/${this.uuid}.png`)
    await EnhancedSRGANUpscaler.run(data, `${this.uuid}@lg`)

    this.versions.lg = true

    await this.save()
  }

  static async fromURI (url: string, data: object = {}): Promise<AiImage> {
    const image = await AiImage.create(data)

    await image.fillImageFromURI(url)

    return image
  }
}
