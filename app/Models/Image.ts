import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import sharp from 'sharp'
import Application from '@ioc:Adonis/Core/Application'
import { BaseModel, BelongsTo, HasMany, ManyToMany, beforeCreate, belongsTo, column, computed, hasMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import { toDriveFromURI } from 'App/Helpers/drive'
import { execute } from 'App/Helpers/execute'
import Account from './Account'
import axios from 'axios'
import { renderPage } from 'App/Services/PageRenderer'
import Vote from './Vote'
import Post from './Post'
import Cast from './Cast'
import SetSubmission from './SetSubmission'
import Opepen from './Opepen'

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

  @column()
  public points: number

  @column()
  public aspectRatio: number

  @computed()
  public get cdn (): string {
    return Env.get('CDN_URL')
  }

  @computed()
  public get path (): string {
    return `images`
  }

  @computed()
  public get isVideo (): boolean {
    return ['webm', 'mp4'].includes(this.type)
  }

  @computed()
  public get isAnimated (): boolean {
    return this.isVideo || ['apng', 'gif'].includes(this.type)
  }

  public get staticType (): string {
    return this.isAnimated || this.type === 'svg' ? 'png' : this.type
  }

  public get originalURI (): string {
    return `${this.cdn}/${this.path}/${this.uuid}.${this.type}`
  }

  public get staticURI (): string {
    if (this.versions.sm) {
      return `${this.cdn}/${this.path}/${this.uuid}@sm.${this.staticType}`
    }

    return this.renderURI
  }

  public get renderURI (): string {
    return `${Env.get('APP_URL')}/v1/opepen/images/${this.uuid}/render`
  }

  public uri (size: keyof ImageVersions = 'sm'): string {
    return `${this.cdn}/${this.path}/${this.uuid}@${size}.${this.staticType}`
  }

  @belongsTo(() => Account, {
    foreignKey: 'creator',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    }
  })
  public creatorAccount: BelongsTo<typeof Account>

  @hasMany(() => Vote)
  public votes: HasMany<typeof Vote>

  @manyToMany(() => Post)
  public posts: ManyToMany<typeof Post>

  /**
   * Main Relations...
   *
   * These are non-normalized data points for easy retrieval & cashing...
   */

  @column({ serializeAs: null })
  public postId: bigint|null

  @belongsTo(() => Post, {
    foreignKey: 'postId',
  })
  public cachedPost: BelongsTo<typeof Post>

  @column({ serializeAs: null })
  public castId: bigint|null

  @belongsTo(() => Cast, {
    foreignKey: 'castId',
  })
  public cachedCast: BelongsTo<typeof Cast>

  @column({ serializeAs: null })
  public setSubmissionId: number|null

  @belongsTo(() => SetSubmission, {
    foreignKey: 'setSubmissionId',
  })
  public cachedSetSubmission: BelongsTo<typeof SetSubmission>

  @column({ serializeAs: null })
  public opepenId: bigint|null

  @belongsTo(() => Opepen, {
    localKey: 'tokenId',
    foreignKey: 'opepenId',
  })
  public cachedOpepen: BelongsTo<typeof Opepen>

  async clearCashed () {
    this.opepenId = null
    this.setSubmissionId = null
    this.castId = null
    this.postId = null

    await this.save()
  }

  async calculatePoints () {
    const image: Image = this

    await image.load('votes')

    image.points = image.votes.reduce((acc, curr) => acc + curr.points, 0)

    await image.save()
  }

  async fillImageFromURI (url: string): Promise<Image> {
    const file = await toDriveFromURI(url, this.uuid)
    this.type = file?.fileType || 'png'
    await this.save()
    return this
  }

  async generateScaledVersions (): Promise<void> {
    try {
      console.log(`GENERATING SCALED VERSION`)
      let key = `images/${this.uuid}.${this.type}`

      // Generate still
      if (this.isAnimated) {
        await this.generateStill()

        key += '.png'
      }

      const original = await Drive.get(key)
      await this.renderToScaledVersions(original)
    } catch (e) {
      // ...
      console.log(e)
    }
  }

  async renderToScaledVersions (image: Buffer) {
    const imageProcessor = await sharp(image)
    const metadata = await imageProcessor.metadata()
    const distType = this.isAnimated || this.type === 'svg' ? 'png' : this.type

    if (! metadata.width || !['png', 'jpeg', 'webp'].includes(distType)) return

    this.aspectRatio = metadata.width / (metadata.height || metadata.width)

    if (metadata.width > 2048) {
      const v2048 = await imageProcessor.resize({ width: 2048 }).toBuffer()
      await Drive.put(`images/${this.uuid}@xl.${distType}`, v2048, { contentType: `image/${distType}` })
      this.versions.xl = true
    }

    if (metadata.width > 1024) {
      const v1024 = await imageProcessor.resize({ width: 1024 }).toBuffer()
      await Drive.put(`images/${this.uuid}@lg.${distType}`, v1024, { contentType: `image/${distType}` })
      this.versions.lg = true
    }

    const v512 = await imageProcessor.resize({ width: 512 }).toBuffer()
    await Drive.put(`images/${this.uuid}@sm.${distType}`, v512, { contentType: `image/${distType}` })
    this.versions.sm = true

    await this.save()
  }

  async generateStill (): Promise<void> {
    // Download video
    const key = `images/${this.uuid}.${this.type}`
    const pngKey = `${key}.png`
    const file = await Drive.get(key)
    await Drive.use('local').put(key, file)
    const tmp = await Application.tmpPath(`uploads`)

    // Generate video
    try {
      await execute(`ffmpeg -i ${tmp}/${key} -frames:v 1 ${tmp}/${pngKey} -threads 4 -y`)
    } catch (e) {
      // ...
      console.log(e)
    }

    // Upload to CDN
    await Drive.put(pngKey, await Drive.use('local').get(pngKey))

    // Delete local data
    await Promise.all([
      Drive.use('local').delete(key),
      Drive.use('local').delete(pngKey),
    ])
  }

  public async render () {
    const rendered = !! this.versions?.sm

    if (rendered) {
      const response = await axios.get(this.staticURI, { responseType: 'arraybuffer' })

      let contentType = response.headers['content-type']
      let buffer = response.data

      return {
        contentType,
        buffer,
      }
    }

    const buffer = await renderPage(this.originalURI)
    await this.renderToScaledVersions(buffer)

    return {
      contentType: 'image/png',
      buffer,
    }
  }

  public async updateImage (url) {
    await this.fillImageFromURI(url)
    await this.generateScaledVersions()
  }

  static async fromURI (url: string, data: object = { versions: {} }): Promise<Image> {
    const image = await Image.create(data)

    await image.fillImageFromURI(url)

    return image
  }

  static votableQuery () {
    return Image.query()
      .whereHas('cachedPost', query => query.whereNotNull('approvedAt'))
      // Revealed Dynamic Opepen
      .orHas('cachedOpepen')
      // Revealed Print Opepen
      .orWhereHas('cachedSetSubmission', query => query
        .whereNotNull('setId')
        .whereNotNull('revealBlockNumber')
        .whereIn('editionType', ['PRINT', 'NUMBERED_PRINT'])
      )
      // Unrevealed Submissions
      .orWhereHas('cachedSetSubmission', query => query
        .whereNotNull('approvedAt')
        .whereNull('revealBlockNumber')
      )
  }
}
