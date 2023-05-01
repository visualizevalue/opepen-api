import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import sharp from 'sharp'
import { BaseModel, HasOne, beforeCreate, column, computed, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { toDriveFromURI } from 'App/Helpers/drive'
import EnhancedSRGANUpscaler from 'App/Services/Upscalers/EnhancedSRGANUpscaler'
import AiImage from './AiImage'

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

  async fillImageFromURI (url: string): Promise<Image> {
    const file = await toDriveFromURI(url, this.uuid)
    this.type = file?.fileType || 'png'
    await this.save()
    return this
  }

  async generateScaledVersions (): Promise<void> {
    const original = await Drive.get(`images/${this.uuid}.${this.type}`)

    const imageProcessor = await sharp(original)
    const metadata = await imageProcessor.metadata()

    if (! metadata.width || this.type !== 'png') return
    if (metadata.width === 512) {
      this.versions.sm = true
      return this.upscale()
    }

    if (metadata.width > 2048) {
      const v2048 = await imageProcessor.resize({ width: 1024 }).png().toBuffer()
      await Drive.put(`images/${this.uuid}@xl.png`, v2048, { contentType: 'image/png' })
      this.versions.xl = true
    }

    if (metadata.width > 1024) {
      const v1024 = await imageProcessor.resize({ width: 1024 }).png().toBuffer()
      await Drive.put(`images/${this.uuid}@lg.png`, v1024, { contentType: 'image/png' })
      this.versions.lg = true
    }

    if (metadata.width > 512) {
      const v512 = await imageProcessor.resize({ width: 512 }).png().toBuffer()
      await Drive.put(`images/${this.uuid}@sm.png`, v512, { contentType: 'image/png' })
      this.versions.sm = true
    }

    await this.save()
  }

  async upscale (): Promise<void> {
    const data = await Drive.get(`images/${this.uuid}.${this.type}`)
    const key = `${this.uuid}@xl`
    await EnhancedSRGANUpscaler.run(data, key)

    // Scale down to 2x
    const upscaled = await Drive.get(`images/${key}.png`)
    const downscaled = await sharp(upscaled).resize({ width: 1024 }).toBuffer()
    await Drive.put(
      `images/${this.uuid}@lg.png`,
      downscaled,
      { contentType: 'image/png' }
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
