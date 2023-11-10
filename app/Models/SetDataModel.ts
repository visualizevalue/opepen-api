import { DateTime } from 'luxon'
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm'
import { EditionType } from './types'

export default class SetDataModel extends BaseModel {
  public static table = 'sets'

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
  public minSubscriptionPercentage: number

  @column()
  public editionType: EditionType = 'PRINT'

  @computed({ serializeAs: 'is_dynamic' })
  public get isDynamic (): boolean {
    return this.editionType !== 'PRINT'
  }

  @column()
  public revealStrategy: string

  @column()
  public roundedPreview: boolean

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
  public replacedSubmissionId: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime()
  public revealsAt: DateTime

  @column()
  public revealBlockNumber: string
}
