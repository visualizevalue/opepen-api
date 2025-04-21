import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import SetSubmission from './SetSubmission'
import Image from './Image'
import Account from './Account'

export default class ParticipationImage extends BaseModel {
  public static table = 'participation_images'

  @column({ isPrimary: true })
  public id: number

  @column()
  public setSubmissionId: number

  @column()
  public imageId: bigint

  @column()
  public creatorAddress: string

  @column.dateTime()
  public deletedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => SetSubmission, {
    foreignKey: 'setSubmissionId',
  })
  public setSubmission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Image, {
    foreignKey: 'imageId',
  })
  public image: BelongsTo<typeof Image>

  @belongsTo(() => Account, {
    foreignKey: 'creatorAddress',
    localKey: 'address',
  })
  public creator: BelongsTo<typeof Account>
}
