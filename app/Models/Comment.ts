import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import SetSubmission from './SetSubmission'
import Opepen from './Opepen'
import Account from './Account'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public address: string

  @column()
  public body: string

  @column()
  public submissionId: number|null

  @column()
  public opepenId: bigint

  @column()
  public imageId: bigint

  @column()
  public parentCommentId: bigint

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public account: BelongsTo<typeof Account>

  @belongsTo(() => SetSubmission, {
    foreignKey: 'submissionId',
  })
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Opepen, {
    foreignKey: 'opepenId',
    localKey: 'tokenId',
  })
  public opepen: BelongsTo<typeof Opepen>

  @belongsTo(() => Image, {
    foreignKey: 'imageId',
  })
  public image: BelongsTo<typeof Image>

  @belongsTo(() => Comment, {
    foreignKey: 'parentCommentId',
  })
  public parent: BelongsTo<typeof Comment>
}
