import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import { DateTime } from 'luxon'

export default class RichContentLink extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public sortIndex: number|null

  @column()
  public address: string|null

  @column()
  public setId: number|null

  @column()
  public setSubmissionId: number|null

  @column()
  public url: string

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public logoImageId: bigint|null

  @column()
  public coverImageId: bigint|null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Image, {
    foreignKey: 'logoImageId',
  })
  public logo: BelongsTo<typeof Image>

  @belongsTo(() => Image, {
    foreignKey: 'coverImageId',
  })
  public cover: BelongsTo<typeof Image>
}
