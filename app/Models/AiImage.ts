import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, beforeCreate, column, computed } from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import axios from 'axios'

export default class AiImage extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: number

  @column()
  public uuid: string

  @column({ serializeAs: null })
  public modelId: BigInt

  @column({
    // Enable saving BigInts on data...
    prepare: (data: object) =>
      JSON.parse(JSON.stringify(data, (_, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value
      ))
  })
  public data: object

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime()
  public generatedAt: DateTime

  @computed()
  public get uri (): string {
    return `${Env.get('CDN_URL')}/images/${this.uuid}.png`
  }

  @beforeCreate()
  public static async createUUID (model: AiImage) {
    model.uuid = uuid()
  }

  static async fromURI (url: string, data: object = {}): Promise<AiImage> {
    const image = await AiImage.create(data)

    try {
      const response = await axios({ url, responseType: 'stream' })
      const stream = response.data
      const contentLength = response.headers['content-length'] as number
      await Drive.putStream(
        `images/${image.uuid}.png`,
        stream,
        { contentType: 'image/png', contentLength: contentLength }
      )

      image.generatedAt = DateTime.now()
      await image.save()
    } catch (e) {
      // ...
    }

    return image
  }
}
