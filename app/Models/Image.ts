import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import sharp from 'sharp'
import { BaseModel, BelongsTo, HasOne, beforeCreate, belongsTo, column, computed, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { toDriveFromURI } from 'App/Helpers/drive'
import EnhancedSRGANUpscaler from 'App/Services/Upscalers/EnhancedSRGANUpscaler'
import AiImage from './AiImage'
import Account from './Account'

type ImageVersions = {
  sm?: boolean, // 512
  lg?: boolean, // 1024
  xl?: boolean, // 2048
}

export default class Image extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: bigint

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: Image) {
    model.uuid = uuid()
  }

  @column()
  public type: string

  @column({
    consume: value => value || {},
  })
  public versions: ImageVersions

  @column()
  public creator: string

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ serializeAs: null })
  public featuredAt: DateTime

  @computed()
  public get cdn (): string {
    return Env.get('CDN_URL')
  }

  @computed()
  public get path (): string {
    return `images`
  }

  @hasOne(() => AiImage, {
    serializeAs: 'ai_image'
  })
  public aiImage: HasOne<typeof AiImage>

  @belongsTo(() => Account, {
    foreignKey: 'creator',
    localKey: 'address',
  })
  public creatorAccount: BelongsTo<typeof Account>

  async fillImageFromURI (url: string): Promise<Image> {
    const file = await toDriveFromURI(url, this.uuid)
    this.type = file?.fileType || 'png'
    await this.save()
    return this
  }

  async generateScaledVersions (): Promise<void> {
    try {
      const original = await Drive.get(`images/${this.uuid}.${this.type}`)
      const imageProcessor = await sharp(original)
      const metadata = await imageProcessor.metadata()

      if (! metadata.width || !['png', 'jpeg'].includes(this.type)) return

      if (metadata.width > 2048) {
        const v2048 = await imageProcessor.resize({ width: 2048 }).toBuffer()
        await Drive.put(`images/${this.uuid}@xl.${this.type}`, v2048, { contentType: `image/${this.type}` })
        this.versions.xl = true
      }

      if (metadata.width > 1024) {
        const v1024 = await imageProcessor.resize({ width: 1024 }).toBuffer()
        await Drive.put(`images/${this.uuid}@lg.${this.type}`, v1024, { contentType: `image/${this.type}` })
        this.versions.lg = true
      }

      const v512 = await imageProcessor.resize({ width: 512 }).toBuffer()
      await Drive.put(`images/${this.uuid}@sm.${this.type}`, v512, { contentType: `image/${this.type}` })
      this.versions.sm = true

      await this.save()
    } catch (e) {
      // ...
    }
  }

  async upscale (): Promise<void> {
    const key = `${this.uuid}@xl`

    try {
      const data = await Drive.get(`images/${this.uuid}.${this.type}`)
      await EnhancedSRGANUpscaler.run(data, key)
    } catch (e) {
      // Failed to upscale
      return
    }

    // Scale down to 2x
    const upscaled = await Drive.get(`images/${key}.${this.type}`)
    const downscaled = await sharp(upscaled).resize({ width: 1024 }).toBuffer()
    await Drive.put(
      `images/${this.uuid}@lg.${this.type}`,
      downscaled,
      { contentType: `image/${this.type}` }
    )

    // Update image
    this.versions.lg = true
    this.versions.xl = true
    await this.save()
  }

  static async fromURI (url: string, data: object = { versions: {} }): Promise<Image> {
    const image = await Image.create(data)

    await image.fillImageFromURI(url)

    return image
  }
}
