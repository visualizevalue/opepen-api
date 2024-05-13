import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Event from './Event'
import Post from './Post'
import Cast from './Cast'
import SetSubmission from './SetSubmission'
import Subscription from './Subscription'
import SubscriptionHistory from './SubscriptionHistory'

export default class TimelineUpdate extends BaseModel {
  public static table = 'timeline'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public type: string

  @column()
  public blockNumber: string

  @column({ serializeAs: null })
  public address: string

  @column({ serializeAs: null })
  public postId: bigint

  @column({ serializeAs: null })
  public castId: bigint

  @column({ serializeAs: null })
  public eventId: bigint

  @column({ serializeAs: null })
  public opepenId: bigint

  @column({ serializeAs: null })
  public submissionId: number

  @column({ serializeAs: null })
  public subscriptionId: bigint

  @column({ serializeAs: null })
  public subscriptionHistoryId: bigint

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

  @belongsTo(() => Event, {
    onQuery: query => {
      query.preload('fromAccount')
      query.preload('toAccount')
    },
  })
  public event: BelongsTo<typeof Event>

  @belongsTo(() => Post, {
    onQuery: query => {
      query.whereNull('deleted_at')
      query.whereNotNull('approved_at')
      query.preload('account')
    },
  })
  public post: BelongsTo<typeof Post>

  @belongsTo(() => Cast, {
    onQuery: query => {
      // query.whereNotNull('approved_at')
      query.preload('account')
    },
  })
  public cast: BelongsTo<typeof Cast>

  @belongsTo(() => SetSubmission, {
    foreignKey: 'submissionId',
  })
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Subscription, {
    foreignKey: 'subscriptionId',
  })
  public subscription: BelongsTo<typeof Subscription>

  @belongsTo(() => SubscriptionHistory, {})
  public subscriptionHistory: BelongsTo<typeof SubscriptionHistory>

  public static async createFor(model: Post|Cast|SetSubmission|SubscriptionHistory) {
    const update = new TimelineUpdate()

    if (model instanceof Post) {
      update.address = model.address
      update.createdAt = model.createdAt
      update.postId = model.id
      update.type = 'POST:INTERNAL'
    } else if (model instanceof Cast) {
      update.address = model.address
      update.createdAt = model.createdAt
      update.castId = model.id
      update.type = 'POST:FARCASTER'
    } else if (model instanceof SetSubmission) {
      update.address = model.creator
      update.createdAt = model.approvedAt as DateTime
      update.submissionId = model.id
      update.type = 'SET_SUBMISSION:PUBLISH'
    } else if (model instanceof SubscriptionHistory) {
      update.address = model.address
      update.createdAt = model.createdAt
      update.submissionId = model.submissionId
      update.subscriptionId = model.subscriptionId
      update.subscriptionHistoryId = model.id
      update.type = 'SET_SUBMISSION:OPT_IN'
    }

    await update.save()
  }

}
