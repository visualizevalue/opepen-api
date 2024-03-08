import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, computed } from '@ioc:Adonis/Lucid/Orm'
import DynamicSetImages from 'App/Models/DynamicSetImages'
import Image from 'App/Models/Image'
import { ArtistSignature, EditionType, SubmissionStats } from './types'

export default class SetBaseModel extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public artist: string

  @column()
  public creator: string

  @column()
  public description: string

  @column()
  public editionType: EditionType = 'PRINT'

  @computed({ serializeAs: 'is_dynamic' })
  public get isDynamic (): boolean {
    return this.editionType !== 'PRINT'
  }

  @column()
  public roundedPreview: boolean

  @column()
  public minSubscriptionPercentage: number

  @column({ serializeAs: 'edition1Name' })
  public edition_1Name: string
  @column({ serializeAs: 'edition4Name' })
  public edition_4Name: string
  @column({ serializeAs: 'edition5Name' })
  public edition_5Name: string
  @column({ serializeAs: 'edition10Name' })
  public edition_10Name: string
  @column({ serializeAs: 'edition20Name' })
  public edition_20Name: string
  @column({ serializeAs: 'edition40Name' })
  public edition_40Name: string

  @column({ serializeAs: null })
  public edition_1ImageId: bigint
  @column({ serializeAs: null })
  public edition_4ImageId: bigint
  @column({ serializeAs: null })
  public edition_5ImageId: bigint
  @column({ serializeAs: null })
  public edition_10ImageId: bigint
  @column({ serializeAs: null })
  public edition_20ImageId: bigint
  @column({ serializeAs: null })
  public edition_40ImageId: bigint

  @column({ serializeAs: null })
  public dynamicPreviewImageId: bigint

  @column({ serializeAs: null })
  public dynamicSetImagesId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column()
  public revealStrategy: string

  @column.dateTime()
  public revealsAt: DateTime

  @column()
  public revealBlockNumber: string

  @column({
    consume: value => {
      if (! value) return { 1: [], 4: [], 5: [], 10: [], 20: [], 40: [] }

      return value
    },
    serializeAs: null,
  })
  public submittedOpepen: object

  @column()
  public submissionStats: SubmissionStats

  @column()
  public notificationSentAt: DateTime

  @belongsTo(() => Image, { foreignKey: 'edition_1ImageId' })
  public edition1Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition_4ImageId' })
  public edition4Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition_5ImageId' })
  public edition5Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition_10ImageId' })
  public edition10Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition_20ImageId' })
  public edition20Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition_40ImageId' })
  public edition40Image: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'dynamicPreviewImageId' })
  public dynamicPreviewImage: BelongsTo<typeof Image>

  @column({
    consume: (value: string) => typeof value === 'string' ? JSON.parse(value) : value,
    prepare: (value: any) => typeof value === 'object' ? JSON.stringify(value) : value,
  })
  public artistSignature: ArtistSignature

  @belongsTo(() => DynamicSetImages, {
    foreignKey: 'dynamicSetImagesId',
    onQuery: (query) => {
      query.preload('image1_1')
      query.preload('image4_1')
      query.preload('image4_2')
      query.preload('image4_3')
      query.preload('image4_4')
      query.preload('image5_1')
      query.preload('image5_2')
      query.preload('image5_3')
      query.preload('image5_4')
      query.preload('image5_5')
      query.preload('image10_1')
      query.preload('image10_2')
      query.preload('image10_3')
      query.preload('image10_4')
      query.preload('image10_5')
      query.preload('image10_6')
      query.preload('image10_7')
      query.preload('image10_8')
      query.preload('image10_9')
      query.preload('image10_10')
      query.preload('image20_1')
      query.preload('image20_2')
      query.preload('image20_3')
      query.preload('image20_4')
      query.preload('image20_5')
      query.preload('image20_6')
      query.preload('image20_7')
      query.preload('image20_8')
      query.preload('image20_9')
      query.preload('image20_10')
      query.preload('image20_11')
      query.preload('image20_12')
      query.preload('image20_13')
      query.preload('image20_14')
      query.preload('image20_15')
      query.preload('image20_16')
      query.preload('image20_17')
      query.preload('image20_18')
      query.preload('image20_19')
      query.preload('image20_20')
      query.preload('image40_1')
      query.preload('image40_2')
      query.preload('image40_3')
      query.preload('image40_4')
      query.preload('image40_5')
      query.preload('image40_6')
      query.preload('image40_7')
      query.preload('image40_8')
      query.preload('image40_9')
      query.preload('image40_10')
      query.preload('image40_11')
      query.preload('image40_12')
      query.preload('image40_13')
      query.preload('image40_14')
      query.preload('image40_15')
      query.preload('image40_16')
      query.preload('image40_17')
      query.preload('image40_18')
      query.preload('image40_19')
      query.preload('image40_20')
      query.preload('image40_21')
      query.preload('image40_22')
      query.preload('image40_23')
      query.preload('image40_24')
      query.preload('image40_25')
      query.preload('image40_26')
      query.preload('image40_27')
      query.preload('image40_28')
      query.preload('image40_29')
      query.preload('image40_30')
      query.preload('image40_31')
      query.preload('image40_32')
      query.preload('image40_33')
      query.preload('image40_34')
      query.preload('image40_35')
      query.preload('image40_36')
      query.preload('image40_37')
      query.preload('image40_38')
      query.preload('image40_39')
      query.preload('image40_40')
    }
  })
  public dynamicPreviewImages: BelongsTo<typeof DynamicSetImages>
}
