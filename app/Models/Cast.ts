import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, ManyToMany, belongsTo, column, hasMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import SetSubmission from './SetSubmission'
import Opepen from './Opepen'
import Account from './Account'

export default class Cast extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public address: string

  @column()
  public data: object

  @column()
  public hash: string

  @column()
  public hashScheme: string

  @column()
  public signature: string

  @column()
  public signatureScheme: string

  @column()
  public signer: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

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

  @belongsTo(() => Post, {
    foreignKey: 'parentPostId',
  })
  public parent: BelongsTo<typeof Post>

  @belongsTo(() => Image, {
    foreignKey: 'imageId',
  })
  public image: BelongsTo<typeof Image>

  @manyToMany(() => Image)
  public images: ManyToMany<typeof Image>

  @hasMany(() => Post, {
    foreignKey: 'parentPostId',
    onQuery: query => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
    },
  })
  public commentsCount: HasMany<typeof Post>


  @hasMany(() => Post, {
    foreignKey: 'parentPostId',
    onQuery: query => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
      query.orderBy('createdAt')
    },
  })
  public comments: HasMany<typeof Post>
  @hasMany(() => Post, {
    foreignKey: 'parentPostId',
    onQuery: query => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
      query.orderBy('createdAt', 'desc')
      query.preload('account')
      query.limit(3)
    }
  })
  public latestComments: HasMany<typeof Post>

  public serializeExtras() {
    return {
      commentsCount: this.$extras.commentsCount_count
        ? parseInt(this.$extras.commentsCount_count)
        : undefined,
    }
  }
}
