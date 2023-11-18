import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, BelongsTo, HasMany, beforeCreate, belongsTo, column, computed, hasMany, scope } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import Account from './Account'
import SetModel from './SetModel'
import { EditionType, ArtistSignature } from './types'
import RichContentLink from './RichContentLink'

export default class SetSubmission extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: number

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: SetSubmission) {
    model.uuid = uuid()
  }

  @column()
  public creator: string

  @column()
  public artist: string

  @column()
  public name: string

  @column()
  public description: string

  @column()
  public editionType: EditionType = 'PRINT'

  @computed({ serializeAs: 'is_dynamic' })
  public get isDynamic (): boolean {
    return this.editionType !== 'PRINT'
  }

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

  @column()
  public status: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime()
  public deletedAt: DateTime|null

  @column.dateTime()
  public starredAt: DateTime|null

  @column.dateTime()
  public publishedAt: DateTime|null

  @column()
  public setId: number

  @column({
    consume: (value: string) => typeof value === 'string' ? JSON.parse(value) : value,
    prepare: (value: any) => typeof value === 'object' ? JSON.stringify(value) : value,
  })
  public artistSignature: ArtistSignature

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

  @belongsTo(() => Account, {
    foreignKey: 'creator',
    localKey: 'address',
  })
  public creatorAccount: BelongsTo<typeof Account>

  @belongsTo(() => SetModel, {
    foreignKey: 'setId',
    localKey: 'id',
  })
  public set: BelongsTo<typeof SetModel>

  @hasMany(() => RichContentLink, {
    foreignKey: 'setSubmissionId',
    localKey: 'id',
  })
  public richContentLinks: HasMany<typeof RichContentLink>

  public static active = scope((query) => {
    query.whereNull('deletedAt')
  })

  public static starred = scope((query) => {
    query.whereNotNull('starredAt')
  })

  public static unstarred = scope((query) => {
    query.whereNull('starredAt')
  })

  public static published = scope((query) => {
    query.whereNotNull('publishedAt')
  })

  public static unpublished = scope((query) => {
    query.whereNull('publishedAt')
  })

  public static complete = scope((query) => {
    query.whereNotNull('name').andWhereNot('name', '')
    query.whereNotNull('description').andWhereNot('description', '')
    query.whereNotNull('edition_1Name').andWhereNot('edition_1Name', '')
    query.whereNotNull('edition_4Name').andWhereNot('edition_4Name', '')
    query.whereNotNull('edition_5Name').andWhereNot('edition_5Name', '')
    query.whereNotNull('edition_10Name').andWhereNot('edition_10Name', '')
    query.whereNotNull('edition_20Name').andWhereNot('edition_20Name', '')
    query.whereNotNull('edition_40Name').andWhereNot('edition_40Name', '')
    query.whereNotNull('edition_1ImageId')
    query.whereNotNull('edition_4ImageId')
    query.whereNotNull('edition_5ImageId')
    query.whereNotNull('edition_10ImageId')
    query.whereNotNull('edition_20ImageId')
    query.whereNotNull('edition_40ImageId')
  })

  public async publish (setId: number, hours?: number) {
    const set = await SetModel.findOrFail(setId)
    const submission: SetSubmission = this

    await submission.load('creatorAccount')
    submission.setId = set.id

    set.name = submission.name
    set.description = submission.description
    set.artist = submission.artist || submission.creatorAccount.display
    set.editionType = submission.editionType
    set.edition_1Name = submission.edition_1Name
    set.edition_4Name = submission.edition_4Name
    set.edition_5Name = submission.edition_5Name
    set.edition_10Name = submission.edition_10Name
    set.edition_20Name = submission.edition_20Name
    set.edition_40Name = submission.edition_40Name
    set.edition_1ImageId = submission.edition_1ImageId
    set.edition_4ImageId = submission.edition_4ImageId
    set.edition_5ImageId = submission.edition_5ImageId
    set.edition_10ImageId = submission.edition_10ImageId
    set.edition_20ImageId = submission.edition_20ImageId
    set.edition_40ImageId = submission.edition_40ImageId
    set.creator = submission.creator
    set.artistSignature = submission.artistSignature

    if (hours) {
      set.revealsAt = DateTime.now()
        .plus({ hours: hours + 1 })
        .set({ minute: 0, second: 0, millisecond: 0 })
    }

    if (! submission.publishedAt) {
      submission.publishedAt = DateTime.now()
    }

    // Clear demand...
    if (! submission.setId && submission.setId !== set.id) {
      await set.clearOptIns()
    }

    await submission.save()
    await set.save()
  }

}
