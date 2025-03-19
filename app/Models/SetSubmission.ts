import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, BelongsTo, ModelQueryBuilderContract, beforeCreate, belongsTo, column, computed, scope, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Logger from '@ioc:Adonis/Core/Logger'
import { string } from '@ioc:Adonis/Core/Helpers'
import BotNotifications from 'App/Services/BotNotifications'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/SetModel'
import { ArtistSignature, EditionGroups, EditionType, CurationStats, SubmissionStats } from './types'
import Image from './Image'
import DynamicSetImages from './DynamicSetImages'
import Subscription from './Subscription'
import Opepen from './Opepen'
import provider from 'App/Services/RPCProvider'
import Reveal from 'App/Services/Metadata/Reveal/Reveal'
import NotifyNewCuratedSubmissionEmail from 'App/Mailers/NotifyNewCuratedSubmissionEmail'
import NotifyNewSubmissionEmail from 'App/Mailers/NotifyNewSubmissionEmail'
import NotifySubmissionRevealPausedEmail from 'App/Mailers/NotifySubmissionRevealPausedEmail'
import NotifySubmissionRevealStartedEmail from 'App/Mailers/NotifySubmissionRevealStartedEmail'
import Database from '@ioc:Adonis/Lucid/Database'
import { timeRemaining } from 'App/Helpers/time'
import RichContentLink from './RichContentLink'

type Builder = ModelQueryBuilderContract<typeof SetSubmission>

export const OPT_IN_HOURS = 72

const NOTIFICATIONS = {
  NewSubmission: NotifyNewSubmissionEmail,
  NewCuratedSubmission: NotifyNewCuratedSubmissionEmail,
  RevealStarted: NotifySubmissionRevealStartedEmail,
  RevealPaused: NotifySubmissionRevealPausedEmail,
}

const activeSubmissionScope = (query, submission) => {
  query.join('opepens', query => {
    query.on('opepens.owner', '=', 'accounts.address')
         .andOnVal('opepens.submission_id', '=', submission.id)
  })
}
const SCOPED_NOTIFICATIONS = {
  RevealStarted: activeSubmissionScope,
  RevealPaused: activeSubmissionScope,
}

export const DEFAULT_REMAINING_REVEAL_TIME = OPT_IN_HOURS * 60 * 60

const DEFAULT_SUBMISSION_STATS = {
  "demand": {
    "1": 0,
    "4": 0,
    "5": 0,
    "10": 0,
    "20": 0,
    "40": 0,
    "total": 0
  },
  "holders": {
    "1": 0,
    "4": 0,
    "5": 0,
    "10": 0,
    "20": 0,
    "40": 0,
    "total": 0
  },
  "opepens": {
    "1": 0,
    "4": 0,
    "5": 0,
    "10": 0,
    "20": 0,
    "40": 0,
    "total": 0
  }
}

export default class SetSubmission extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public uuid: string

  @beforeCreate()
  public static async createUUID (model: SetSubmission) {
    model.uuid = uuid()
  }

  @column()
  public name: string

  @column()
  public artist: string

  @column()
  public creator: string

  @column()
  public coCreator_1: string

  @column()
  public coCreator_2: string

  @column()
  public coCreator_3: string

  @column()
  public coCreator_4: string

  @column()
  public coCreator_5: string

  @column()
  public description: string

  @column()
  public search: string

  @column()
  public status: string

  @column.dateTime({ autoUpdate: true })
  public updatedAt: DateTime

  @column.dateTime()
  public deletedAt: DateTime|null

  @column.dateTime()
  public publishedAt: DateTime|null

  @column.dateTime()
  public starredAt: DateTime|null

  @column.dateTime()
  public pausedAt: DateTime|null

  @column.dateTime()
  public lastOptInAt: DateTime|null

  @column.dateTime()
  public archivedAt: DateTime|null

  @column.dateTime()
  public shadowedAt: DateTime|null

  @column()
  public setId: number

  @column()
  public featured: number

  @column()
  public editionType: EditionType = 'PRINT'

  @computed({ serializeAs: 'is_dynamic' })
  public get isDynamic (): boolean {
    return this.editionType !== 'PRINT'
  }

  @column()
  public roundedPreview: boolean

  @column({
    consume: value => {
      return value || 100
    }
  })
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
  public revealsAt: DateTime|null

  @column()
  public remainingRevealTime: number

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

  @column({ serializeAs: null })
  public revealSubmissionsInput: string

  @column()
  public revealSubmissionsInputCid: string

  @column({ serializeAs: null })
  public revealSubmissionsOutput: { [key: string]: any }

  @column()
  public revealSubmissionsOutputCid: string

  @column({
    consume: value => {
      if (! value) return DEFAULT_SUBMISSION_STATS

      return value
    }
  })
  public submissionStats: SubmissionStats

  @column({
    consume: value => {
      if (! value) return {
        1: {},
        4: {},
        5: {},
        10: {},
        20: {},
        40: {},
        total: {},
      }

      return value
    },
    serializeAs: null,
  })
  public curationStats: CurationStats

  @column()
  public demand: number

  @column()
  public preferredSetId: number

  @column()
  public notificationSentAt: DateTime

  @column({
    consume: (value: string) => typeof value === 'string' ? JSON.parse(value) : value,
    prepare: (value: any) => typeof value === 'object' ? JSON.stringify(value) : value,
  })
  public artistSignature: ArtistSignature

  @column()
  public points: number

  @column()
  public votesCount: number

  @column()
  public voteScore: number

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

  @belongsTo(() => DynamicSetImages, {
    foreignKey: 'dynamicSetImagesId',
    onQuery: (query) => {
      query.preload('image1_1')

      query.preload('image4_1').preload('image4_2').preload('image4_3').preload('image4_4')

      query.preload('image5_1').preload('image5_2').preload('image5_3').preload('image5_4').preload('image5_5')

      query.preload('image10_1').preload('image10_2').preload('image10_3').preload('image10_4').preload('image10_5')
           .preload('image10_6').preload('image10_7').preload('image10_8').preload('image10_9').preload('image10_10')

      query.preload('image20_1').preload('image20_2').preload('image20_3').preload('image20_4').preload('image20_5')
           .preload('image20_6').preload('image20_7').preload('image20_8').preload('image20_9').preload('image20_10')
           .preload('image20_11').preload('image20_12').preload('image20_13').preload('image20_14').preload('image20_15')
           .preload('image20_16').preload('image20_17').preload('image20_18').preload('image20_19').preload('image20_20')

      query.preload('image40_1').preload('image40_2').preload('image40_3').preload('image40_4').preload('image40_5')
           .preload('image40_6').preload('image40_7').preload('image40_8').preload('image40_9').preload('image40_10')
           .preload('image40_11').preload('image40_12').preload('image40_13').preload('image40_14').preload('image40_15')
           .preload('image40_16').preload('image40_17').preload('image40_18').preload('image40_19').preload('image40_20')
           .preload('image40_21').preload('image40_22').preload('image40_23').preload('image40_24').preload('image40_25')
           .preload('image40_26').preload('image40_27').preload('image40_28').preload('image40_29').preload('image40_30')
           .preload('image40_31').preload('image40_32').preload('image40_33').preload('image40_34').preload('image40_35')
           .preload('image40_36').preload('image40_37').preload('image40_38').preload('image40_39').preload('image40_40')
    }
  })
  public dynamicSetImages: BelongsTo<typeof DynamicSetImages>

  @belongsTo(() => SetModel, {
    foreignKey: 'setId',
  })
  public set: BelongsTo<typeof SetModel>

  @belongsTo(() => Account, {
    foreignKey: 'creator',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public creatorAccount: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'coCreator_1',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public coCreator1Account: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'coCreator_2',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public coCreator2Account: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'coCreator_3',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public coCreator3Account: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'coCreator_4',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public coCreator4Account: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'coCreator_5',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public coCreator5Account: BelongsTo<typeof Account>

  @hasMany(() => RichContentLink, {
    foreignKey: 'setSubmissionId',
    localKey: 'id',
  })
  public richContentLinks: HasMany<typeof RichContentLink>

  // TODO: rename to visible (?)
  public static active = scope((query) => {
    query.whereNull('deletedAt')
    query.whereNull('shadowedAt')
  })

  public static published = scope((query) => {
    query.whereNotNull('publishedAt')
  })

  public static unpublished = scope((query) => {
    query.whereNull('publishedAt')
  })

  public static starred = scope((query) => {
    query.whereNotNull('starredAt')
  })

  public static shadowed = scope((query) => {
    query.whereNotNull('shadowedAt')
  })

  public static unstarred = scope((query) => {
    query.whereNull('starredAt')
  })

  public static archived = scope((query) => {
    query.whereNotNull('archivedAt')
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

  public static live = scope((query: Builder) => {
    query.withScopes(scopes => {
      scopes.active()
      scopes.published()
    })
  })

  public static activeTimer = scope((query: Builder) => {
    query.withScopes(scopes => scopes.live())
    query.whereNotNull('revealsAt')
    query.whereNull('setId')
    query.orderBy('revealsAt')
  })

  public static pausedTimer = scope((query: Builder) => {
    query.withScopes(scopes => scopes.live())
    query.whereNull('revealsAt')
    query.where('remainingRevealTime', '>', 0)
    query.where('remainingRevealTime', '<', DEFAULT_REMAINING_REVEAL_TIME)
    query.orderBy('remainingRevealTime')
  })

  public static noTimer = scope((query: Builder) => {
    query.withScopes(scopes => scopes.live())
    query.whereNull('revealsAt')
  })

  public static orderActiveByRemainingTime = scope((query: Builder) => {
    query.orderByRaw(
      `COALESCE(reveals_at, '3000-01-01') asc, COALESCE(remaining_reveal_time, ${DEFAULT_REMAINING_REVEAL_TIME}) asc`
    )
  })

  public static orderByRemainingTime = scope((query: Builder) => {
    query
      .select(Database.raw(`
        *,
        CASE
          WHEN reveals_at IS NULL THEN remaining_reveal_time
          ELSE EXTRACT(EPOCH FROM (reveals_at - NOW()))
        END AS seconds_remaining`))
      .orderBy(`seconds_remaining`)
  })

  public static prereveal = scope((query: Builder) => {
    query
      .withScopes(scopes => {
        scopes.live()
        scopes.orderActiveByRemainingTime()
      })
      .where(query => query
        // Active Timer
        .where(query => query
          .whereNotNull('revealsAt')
          .whereNull('setId')
        // Paused Timer
        ).orWhere(query => query
            .whereNull('revealsAt')
            .where('remainingRevealTime', '>', 0)
            .where('remainingRevealTime', '<', DEFAULT_REMAINING_REVEAL_TIME)
            .where('pausedAt', '>', DateTime.now().minus({ hours: 24 }).toISO())
        )
      )
      .whereNull('setId')
  })

  public async updateDynamicSetImagesCache () {
    const submission: SetSubmission = this
    await submission.load('dynamicSetImages')

    // Clear cache
    await Image.query()
      .where('setSubmissionId', submission.id)
      .whereNot('id', `${submission.edition_1ImageId ? submission.edition_1ImageId : 0n}`)
      .update({ setSubmissionId: null })
      .exec()

    // Update cache
    await Image.query()
      .whereIn('uuid', submission.dynamicSetImages.images().filter(i => !!i).map(i => i.uuid))
      .update({ setSubmissionId: submission.id })
      .exec()
  }

  public remainingDuration () {
    return this.revealsAt
      ? this.revealsAt.diff(DateTime.now())
      : DateTime.now().plus({ seconds: this.remainingRevealTime }).diff(DateTime.now())
  }

  public remainingSeconds () {
    return this.remainingDuration().as('seconds')
  }

  public timeRemainigStr () {
    return timeRemaining(this.remainingDuration())
  }

  public optInOpen () {
    if (this.starredAt) {
      return this.starredAt < DateTime.now() &&
        this.starredAt.plus({ hours: OPT_IN_HOURS }) > DateTime.now()
    }

    return ! this.revealsAt
  }

  public async creators () {
    const sub: SetSubmission = this
    await sub.load((loader) => {
      loader.load('creatorAccount')
            .load('coCreator1Account')
            .load('coCreator2Account')
            .load('coCreator3Account')
            .load('coCreator4Account')
            .load('coCreator5Account')
    })

    return [
      sub.creatorAccount,
      sub.coCreator1Account,
      sub.coCreator2Account,
      sub.coCreator3Account,
      sub.coCreator4Account,
      sub.coCreator5Account,
    ].filter(c => !!c)
  }

  public async creatorNames () {
    const creators = await this.creators()

    return creators.map(c => c.display)
  }

  public async creatorNamesForX () {
    const creators = await this.creators()

    return creators.map(c => c.twitterHandle ? `@${c.twitterHandle}` : c.display)
  }

  public async creatorNamesStr () {
    return string.toSentence(await this.creatorNames())
  }

  public async creatorNamesForXStr () {
    return string.toSentence(await this.creatorNamesForX())
  }

  public async updateSearchString () {
    this.search = [
      this.name,
      // this.description,
      // this.edition_1Name,
      // this.edition_4Name,
      // this.edition_5Name,
      // this.edition_10Name,
      // this.edition_20Name,
      // this.edition_40Name,
      ...(
        (await this.creators()).map(c => [c.display, c.address, c.ens]
          .filter(i => !!i)
          .join(' ')
        )
      ),
    ].join(' ')

    await this.save()
  }

  public async startRevealTimer () {
    if (this.revealsAt || !this.starredAt) return

    this.revealsAt = this.starredAt.plus({ hours: OPT_IN_HOURS })
    this.remainingRevealTime = 0
    this.pausedAt = null

    await this.save()

    await BotNotifications.consensusReached(this)
    await this.notify('RevealStarted')
  }

  public async pauseRevealTimer () {
    const now = DateTime.now()

    if (! this.revealsAt) return
    if (this.revealsAt < now) return

    this.remainingRevealTime = 0
    this.revealsAt = null
    this.pausedAt = DateTime.now()

    await this.save()

    await BotNotifications.consensusPaused(this)
    await this.notify('RevealPaused')
  }

  public async scheduleReveal () {
    try {
      await (new Reveal()).schedule(this)

      await BotNotifications?.provenance(this)
    } catch (e) {
      Logger.error(`Something went wrong while scheduling the reveal: ${e}`)
      console.error(e)
    }
  }

  public async reveal (setId: number|null = this.preferredSetId) {
    const submission: SetSubmission = this
    const set = setId
      ? await SetModel.findOrFail(setId)
      : await SetModel.query().whereNull('submissionId').orderBy('id').firstOrFail()

    const currentBlock = await provider.getBlockNumber()
    const revealBlock = Number(this.revealBlockNumber)

    if (! submission.revealsAt) throw new Error(`Unscheduled reveal`)
    if (
      currentBlock < revealBlock + 5 ||
      submission.revealsAt > DateTime.now()
    ) throw new Error(`Not time to reveal yet`)
    if (submission.setId && set.id !== submission.setId) throw new Error(`Not allowed to re-reveal to a set`)

    try {
      await (new Reveal()).compute(submission, set)

      // Update sets counts for contributors
      const creators = await this.creators()
      for (const creator of creators) {
        creator.setsCount += 1
        await creator.save()
      }
    } catch (e) {
      Logger.info(`Something bad happened during reveal of set ${set.id} and submission ${submission.uuid}: ${e}`)
      console.error(e)
    }
  }

  public async opepensInSetSubmission () {
    const opepens = {
      1: new Set(),
      4: new Set(),
      5: new Set(),
      10: new Set(),
      20: new Set(),
      40: new Set(),
    }
    const subscriptions = await Subscription.query().where('submission_id', this.id)
    for (const s of subscriptions) {
      for (const id of s.opepenIds) {
        const opepen = await Opepen.find(id)
        if (! opepen) continue

        opepens[opepen.data?.edition].add(opepen.tokenId)
      }
    }

    return {
      1: Array.from(opepens['1']),
      4: Array.from(opepens['4']),
      5: Array.from(opepens['5']),
      10: Array.from(opepens['10']),
      20: Array.from(opepens['20']),
      40: Array.from(opepens['40']),
    }
  }

  public async updateAndValidateOpepensInSet () {
    const demandBefore = this.submissionStats?.demand.total || 0

    await this.cleanSubscriptionsAndStats()
    await this.maybeStartOrStopTimer()
    await this.maybeSendDemandMultipleNotification(demandBefore)

  }

  public async maybeSendDemandMultipleNotification (demandBefore: number) {
    const demandAfter = this.submissionStats?.demand.total || 0

    const beforeMultiple = Math.floor(demandBefore / 80)
    const afterMultiple = Math.floor(demandAfter / 80)

    if (beforeMultiple < afterMultiple && afterMultiple >= 2) {
      await BotNotifications.consensusMultiple(this)
    }
  }

  public async clearOptIns () {
    await Promise.all([
      Subscription.query().where('submissionId', this.id).update({ submissionId: null }),
      Opepen.query().where('submissionId', this.id).update({ submissionId: null }),
    ])

    this.submissionStats = DEFAULT_SUBMISSION_STATS
    await this.cleanSubscriptionsAndStats()
  }

  // FIXME: Clean up this ducking mess!
  public async cleanSubscriptionsAndStats () {
    const subscriptions = await Subscription.query().where('submissionId', this.id)

    const holders = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }
    const opepens = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }
    const demand = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }
    const curationStats = { 1: {}, 4: {}, 5: {}, 10: {}, 20: {}, 40: {}, total: {} }

    for (const subscription of subscriptions) {
      const submittedOpepen = await Opepen.query().whereIn('token_id', subscription.opepenIds)

      const groups = submittedOpepen.reduce((groups, opepen) => {
        groups[opepen.data.edition].push(opepen.tokenId)

        return groups
      }, { 1: [], 4: [], 5: [], 10: [], 20: [], 40: [] } as EditionGroups)

      for (const edition in groups) {
        if (! subscription.maxReveals) {
          subscription.maxReveals = {}
        }

        const opepenCount = groups[edition].length
        const overallocated = opepenCount >= subscription.maxReveals[edition]
        const isOneOfOneOptIn = edition === '1' && opepenCount

        subscription.maxReveals[edition] = (
          overallocated &&
          typeof subscription.maxReveals[edition] === 'number' &&
          subscription.maxReveals[edition] > 0
        )
          ? subscription.maxReveals[edition]
          : opepenCount

        if (isOneOfOneOptIn) {
          subscription.maxReveals[edition] = 1
        }

        if (subscription.maxReveals[edition] > 0) {
          holders[edition] ++
        }

        const actual = isOneOfOneOptIn
          ? opepenCount
          : Math.min(subscription.maxReveals[edition], opepenCount)

        demand[edition] += actual
        demand.total += actual
        opepens[edition] += opepenCount
        opepens.total += opepenCount

        // Update curator stats
        if (actual) {
          if (! curationStats[edition][subscription.address]) {
            curationStats[edition][subscription.address] = { opepens: 0, demand: 0 }
          }
          if (! curationStats.total[subscription.address]) {
            curationStats.total[subscription.address] = { opepens: 0, demand: 0 }
          }
          curationStats[edition][subscription.address].opepens += opepenCount
          curationStats.total[subscription.address].opepens += opepenCount
          curationStats[edition][subscription.address].demand += actual
          curationStats.total[subscription.address].demand += actual
        }
      }

      if (subscription.opepenIds?.length) {
        holders.total ++
      }

      await subscription.save()
    }

    const owners = await Opepen.holdersAtBlock(parseInt(this.revealBlockNumber) || 9999999999999999)

    this.submissionStats = {
      ...this.submissionStats,
      totalHolders: owners.size,
      holders,
      opepens,
      demand,
    }
    this.curationStats = curationStats
    this.demand = demand.total * (this.submissionStats.totalHolders ?? 1) // save for easy access and sorting
    this.submittedOpepen = await this.opepensInSetSubmission()
    await this.save()
  }

  public async maybeStartOrStopTimer () {
    const demand = this.submissionStats.demand

    const editions = [1, 4, 5, 10, 20, 40]

    let demandMet = true

    for (const edition of editions) {
      if (demand[edition] < edition) {
        demandMet = false
      }
    }

    if (demandMet) {
      await this.startRevealTimer()
    } else {
      await this.pauseRevealTimer()
    }
  }

  public async notify (scopeKey: keyof typeof NOTIFICATIONS, sendNow: boolean = false) {
    Logger.info(`SetSubmission.notify(): ${scopeKey}`)
    const query = Account.query().withScopes(scopes => scopes.receivesEmail(scopeKey))

    if (SCOPED_NOTIFICATIONS[scopeKey]) {
      SCOPED_NOTIFICATIONS[scopeKey](query, this)
    }

    const users = await query.distinct('email', 'address', 'ens', 'name')
    Logger.info(`Scheduling emails for ${users.length} users`)

    const Mailer = NOTIFICATIONS[scopeKey]

    const sentEmails = new Set()
    for (const user of users) {
      if (sentEmails.has(user.email)) continue

      try {
        if (sendNow) {
          await new Mailer(user, this).send()
        } else {
          await new Mailer(user, this).sendLater()
        }
        Logger.info(`${scopeKey} email scheduled: ${user.email}`)
      } catch (e) {
        Logger.warn(`Error scheduling ${scopeKey} email: ${user.email}: ${e}`)
      }

      sentEmails.add(user.email)
    }
  }
}
