import { DateTime, Duration } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'
import { afterSave, BaseModel, beforeSave, BelongsTo, belongsTo, column, computed, HasMany, hasMany, ModelQueryBuilderContract, scope } from '@ioc:Adonis/Lucid/Orm'
import Address from 'App/Helpers/Address'
import provider from 'App/Services/RPCProvider'
import Image from 'App/Models/Image'
import RichContentLink from 'App/Models/RichContentLink'
import { ArtistSocials, FarcasterData, OauthData } from './types'
import Opepen from './Opepen'
import Event from './Event'
import Subscription from './Subscription'
import SubscriptionHistory from './SubscriptionHistory'
import SetSubmission from './SetSubmission'
import Vote from './Vote'

type Builder = ModelQueryBuilderContract<typeof Account>

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public address: string

  @column()
  public name: string

  @column()
  public ens: string

  @column()
  public data: object

  @column({
    consume: value => {
      if (! value) return {}

      return value
    }
  })
  public farcaster: FarcasterData

  @column({ serializeAs: null })
  public oauth: OauthData

  @column({ serializeAs: null })
  public email: string

  @column.dateTime({ serializeAs: null })
  public emailVerifiedAt: DateTime|null

  @column.dateTime()
  public notificationsReadUntil: DateTime

  @column({ serializeAs: null })
  public notificationGeneral: boolean

  @column({ serializeAs: null })
  public notificationNewSet: boolean

  @column({ serializeAs: null })
  public notificationNewSubmission: boolean

  @column({ serializeAs: null })
  public notificationNewCuratedSubmission: boolean

  @column({ serializeAs: null })
  public notificationRevealStarted: boolean

  @column({ serializeAs: null })
  public notificationRevealPaused: boolean

  @column()
  public pfpImageId: bigint|null

  @column()
  public coverImageId: bigint|null

  @column()
  public tagline: string

  @column()
  public quote: string

  @column()
  public bio: string

  @column()
  public setSubmissionsCount: number

  @column()
  public setsCount: number

  @column()
  public profileCompletion: number

  @column()
  public votesCount: number

  @column({
    consume: (value: string) => typeof value === 'string' ? JSON.parse(value) : value,
    prepare: (value: any) => Array.isArray(value) ? JSON.stringify(value) : value,
  })
  public socials: ArtistSocials

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get twitterHandle () {
    return this.oauth?.twitterUser?.username
  }

  @computed()
  public get display () {
    if (this.name) return this.name
    if (this.ens) {
      if (this.ens.endsWith('.eth')) return this.ens.slice(0, -4)

      return this.ens
    }
    if (this.twitterHandle) return this.twitterHandle

    return Address.short(this.address)
  }

  @belongsTo(() => Image, {
    foreignKey: 'pfpImageId',
  })
  public pfp: BelongsTo<typeof Image>

  @belongsTo(() => Image, {
    foreignKey: 'coverImageId',
  })
  public coverImage: BelongsTo<typeof Image>

  @hasMany(() => Opepen, {
    foreignKey: 'owner',
    localKey: 'address',
  })
  public opepen: HasMany<typeof Opepen>

  @hasMany(() => SetSubmission, {
    foreignKey: 'creator',
    localKey: 'address',
  })
  public submissions: HasMany<typeof SetSubmission>

  @hasMany(() => Subscription, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public subscriptions: HasMany<typeof Subscription>

  @hasMany(() => SubscriptionHistory, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public subscriptionsHistory: HasMany<typeof SubscriptionHistory>

  @hasMany(() => Vote, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public votes: HasMany<typeof Vote>

  @hasMany(() => RichContentLink, {
    foreignKey: 'address',
    localKey: 'address',
    onQuery: query => {
      query.whereNull('setId')
      query.whereNull('setSubmissionId')
    }
  })
  public richContentLinks: HasMany<typeof RichContentLink>

  public static receivesEmails = scope((query: Builder) => {
    query.whereNotNull('email').whereNotNull('emailVerifiedAt')
  })

  public static receivesEmail = scope((
    query: Builder,
    key: 'General'|'NewSet'|'NewSubmission'|'NewCuratedSubmission'|'RevealStarted'|'RevealPaused'
  ) => {
    query.withScopes(scopes => scopes.receivesEmails())
         .where(`notification${key}`, true)
  })

  @beforeSave()
  public static async lowerCaseAddress(account: Account) {
    account.address = account.address.toLowerCase()
  }

  @afterSave()
  public static async saveNames (account: Account) {
    if (! Env.get('UPDATE_ENS')) {
      return
    }

    await Promise.all([
      account.updateENS(),
    ])

    try {
      await account.save()
    } catch (e) {
      Logger.error(e)
    }
  }

  public async updateNames () {
    const timeAgo = Math.floor((Date.now() - +this.updatedAt) / 1000)
    if (timeAgo < 60 * 10) { // wait for 10 minutes between updates
      Logger.info(`Don't update names for ${this.address}, as we've updated them ${timeAgo} seconds ago`)
      return
    }

    await Promise.all([
      this.updateENS(),
    ])

    // Force update updatedAt
    this.updatedAt = DateTime.now()

    try {
      await this.save()
    } catch (e) {
      Logger.error(e)
    }

    return this
  }

  public async updateENS () {
    try {
      this.ens = await provider.lookupAddress(this.address) || ''

      if (this.ens) Logger.info(`ENS for ${this.ens} updated`)
    } catch (e) {
      Logger.error(e)
    }
  }

  public async updateProfileCompletion () {
    const account: Account = this
    await account.load('richContentLinks')

    let completion = 0
    if (account.name || account.ens) completion ++
    if (account.pfpImageId) completion ++
    if (account.coverImageId) completion ++
    if (account.tagline) completion ++
    if (account.quote) completion ++
    if (account.bio) completion ++
    if (account.twitterHandle) completion ++
    if (account.socials?.length) completion ++
    if (account.richContentLinks?.length) completion ++

    this.profileCompletion = completion
    await this.save()
  }

  public async updateSetSubmissionsCount () {
    const artistFor = SetSubmission.query()
        .where((query) => {
          query.where('creator', this.address)
              .orWhere('coCreator_1', this.address)
              .orWhere('coCreator_2', this.address)
              .orWhere('coCreator_3', this.address)
              .orWhere('coCreator_4', this.address)
              .orWhere('coCreator_5', this.address)
        })
        .withScopes(scopes => {
          scopes.approved()
          scopes.published()
        })

    const submissionsCount = await artistFor.clone().count('id')
    const setsCount = await artistFor.clone().whereNotNull('set_id').count('id')

    this.setsCount = setsCount[0].$extras.count
    this.setSubmissionsCount = submissionsCount[0].$extras.count

    await this.save()
  }

  public async holdDurations () {
    const events = await Event.query()
      .where('type', 'Transfer')
      .where(query => {
        query.where('to', this.address)
        query.orWhere('from', this.address)
      })
      .orderBy('timestamp', 'asc')

    const holdDurations: Duration[] = []
    let timeHeldSince: DateTime = events[0].timestamp
    let currentAmountHeld = 0

    events.forEach((event, index) => {
      const isIncoming = event.to === this.address

      if (isIncoming && currentAmountHeld === 0) {
        timeHeldSince = event.timestamp
      }

      if (isIncoming) {
        currentAmountHeld ++
      } else {
        currentAmountHeld --
      }

      if (
        // stopped holding
        ! currentAmountHeld ||
        // last event
        index === events.length - 1
      ) {
        if (events.length === 1) {
          holdDurations.push(DateTime.now().diff(timeHeldSince))
        } else {
          holdDurations.push(event.timestamp.diff(timeHeldSince))
        }
      }
    })

    return holdDurations
  }

  public async timeHeld (offset = 0) {
    const uptimes = (await this.holdDurations())

    return uptimes[uptimes.length - 1 - offset]
  }

  public async totalTimeHeld () {
    return (await this.holdDurations())
      .reduce(
        (total, duration) => total.plus(duration),
        Duration.fromObject({ seconds: 0 })
      )
  }

  public serializeExtras() {
    return {
      opepen_count: this.$extras.opepen_count
        ? parseInt(this.$extras.opepen_count)
        : undefined,
    }
  }

  static byId (id) {
    const value = id?.toLowerCase()

    return this.query()
      .where('address', value)
      .orWhere('ens', value)
      .orWhere('ens', `${value}.eth`)
      .preload('pfp')
  }
}
