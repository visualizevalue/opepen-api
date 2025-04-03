import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import {
  BaseModel,
  BelongsTo,
  HasMany,
  ManyToMany,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import SetSubmission from './SetSubmission'
import Opepen from './Opepen'
import Account from './Account'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID(model: Image) {
    model.uuid = uuid()
  }

  @column()
  public address: string

  @column()
  public body: string

  @column()
  public signature: string

  @column()
  public submissionId: number | null

  @column()
  public opepenId: bigint

  @column()
  public imageId: bigint

  @column()
  public parentPostId: bigint

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime()
  public approvedAt: DateTime | null

  @column.dateTime()
  public shadowedAt: DateTime | null

  @column.dateTime()
  public deletedAt: DateTime | null

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
    onQuery: (query) => {
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
    onQuery: (query) => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
    },
  })
  public commentsCount: HasMany<typeof Post>

  @hasMany(() => Post, {
    foreignKey: 'parentPostId',
    onQuery: (query) => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
      query.orderBy('createdAt')
    },
  })
  public comments: HasMany<typeof Post>
  @hasMany(() => Post, {
    foreignKey: 'parentPostId',
    onQuery: (query) => {
      query.whereNull('deletedAt')
      query.whereNotNull('approvedAt')
      query.orderBy('createdAt', 'desc')
      query.preload('account')
      query.limit(3)
    },
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
