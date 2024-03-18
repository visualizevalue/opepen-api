import { DateTime } from 'luxon'
import { v4 as uuid } from 'uuid'
import { BaseModel, BelongsTo, beforeCreate, belongsTo, column, computed, scope } from '@ioc:Adonis/Lucid/Orm'
import Logger from '@ioc:Adonis/Core/Logger'
import Account from 'App/Models/Account'
import SetModel from 'App/Models/SetModel'
import { ArtistSignature, EditionGroups, EditionType, SubmissionStats } from './types'
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

const NOTIFICATIONS = {
  NewSubmission: NotifyNewSubmissionEmail,
  NewCuratedSubmission: NotifyNewCuratedSubmissionEmail,
  RevealStarted: NotifySubmissionRevealStartedEmail,
  RevealPaused: NotifySubmissionRevealPausedEmail,
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
  public description: string

  @column()
  public status: string

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

  @column()
  public editionType: EditionType = 'PRINT'

  @computed({ serializeAs: 'is_dynamic' })
  public get isDynamic (): boolean {
    return this.editionType !== 'PRINT'
  }

  @column()
  public roundedPreview: boolean

  @column()
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

  @column()
  public submissionStats: SubmissionStats

  @column()
  public preferredSetId: number

  @column()
  public notificationSentAt: DateTime

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

  // Note: In here and not the `SetBaseModel` bc of an import loop via Accounts.
  @belongsTo(() => Account, {
    foreignKey: 'creator',
    localKey: 'address',
    onQuery: query => {
      query.preload('pfp')
    },
  })
  public creatorAccount: BelongsTo<typeof Account>

  // @hasMany(() => RichContentLink, {
  //   foreignKey: 'setSubmissionId',
  //   localKey: 'id',
  // })
  // public richContentLinks: HasMany<typeof RichContentLink>

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

  public optInOpen () {
    return this.revealsAt && this.revealsAt > DateTime.now()
  }

  public async startRevealTimer () {
    if (this.revealsAt) return

    await Subscription.clearRevealingOpepenFromOtherSubmissions(this.id)

    this.revealsAt = DateTime.now().plus({ seconds: this.remainingRevealTime })
    this.remainingRevealTime = 0

    await this.save()

    await this.notify('RevealStarted')
  }

  public async pauseRevealTimer () {
    const now = DateTime.now()

    if (! this.revealsAt) return
    if (this.revealsAt < now) return

    this.remainingRevealTime = this.revealsAt.diff(now).as('seconds')
    this.revealsAt = null

    await this.save()

    await this.notify('RevealPaused')
  }

  public async scheduleReveal () {
    if (this.revealBlockNumber) throw new Error(`Reveal block already set`)

    const currentBlock = await provider.getBlockNumber()

    this.revealBlockNumber = (currentBlock + 50).toString()

    await this.save()
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
      currentBlock > revealBlock ||
      submission.revealsAt > DateTime.now()
    ) throw new Error(`Not time to reveal yet`)
    if (set.id !== set.submissionId) throw new Error(`Not allowed to re-reveal to a set`)

    try {
      await (new Reveal()).compute(submission, set)
    } catch (e) {
      Logger.info(`Something bad happened during reveal of set ${set.id} and submission ${submission.uuid}`, e)
    }
  }

  public async opepensInSet () {
    const opepens = {
      1: new Set(),
      4: new Set(),
      5: new Set(),
      10: new Set(),
      20: new Set(),
      40: new Set(),
    }
    const subscriptions = await Subscription.query().where('set_id', this.id)
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
    await this.cleanSubmissionsAndStats()
    await this.maybeStartOrStopTimer()
  }

  public async clearOptIns () {
    this.submissionStats = {
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
    this.submittedOpepen = []

    await this.save()

    await Subscription.query().where('submissionId', this.id).update({ submissionId: null })
  }

  // FIXME: Clean up this ducking mess!
  public async cleanSubmissionsAndStats () {
    const submissions = await Subscription.query().where('setId', this.id)

    const holders = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }
    const opepens = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }
    const demand = { 1: 0, 4: 0, 5: 0, 10: 0, 20: 0, 40: 0, total: 0 }

    for (const submission of submissions) {
      const submittedOpepen = await Opepen.query()
        .whereIn('token_id', submission.opepenIds)

      const groups = submittedOpepen.reduce((groups, opepen) => {
        groups[opepen.data.edition].push(opepen.tokenId)

        return groups
      }, { 1: [], 4: [], 5: [], 10: [], 20: [], 40: [] } as EditionGroups)

      for (const edition in groups) {
        if (! submission.maxReveals) {
          submission.maxReveals = {}
        }

        const opepenCount = groups[edition].length
        const overallocated = opepenCount >= submission.maxReveals[edition]
        const isOneOfOneOptIn = edition === '1' && opepenCount

        submission.maxReveals[edition] = (
          overallocated &&
          typeof submission.maxReveals[edition] === 'number'
        )
          ? submission.maxReveals[edition]
          : opepenCount

        if (isOneOfOneOptIn) {
          submission.maxReveals[edition] = 1
        }

        if (submission.maxReveals[edition] > 0) {
          holders[edition] ++
        }

        const actual = isOneOfOneOptIn
          ? opepenCount
          : Math.min(submission.maxReveals[edition], opepenCount)

        demand[edition] += actual
        demand.total += actual
        opepens[edition] += opepenCount
        opepens.total += opepenCount
      }

      holders.total ++

      await submission.save()
    }

    const owners = await Opepen.holdersAtBlock(parseInt(this.revealBlockNumber) || 9999999999999999)

    this.submissionStats = {
      ...this.submissionStats,
      totalHolders: owners.size,
      holders,
      opepens,
      demand,
    }
    this.submittedOpepen = await this.opepensInSet()
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

  public async notify (scopeKey: keyof typeof NOTIFICATIONS) {
    const users = await Account.query().withScopes(scopes => scopes.receivesEmail(scopeKey))

    const Mailer = NOTIFICATIONS[scopeKey]

    for (const user of users) {
      try {
        await new Mailer(user, this).sendLater()
        Logger.info(`${scopeKey} email scheduled: ${user.email}`)
      } catch (e) {
        Logger.warn(`Error scheduling ${scopeKey} email: ${user.email}`)
      }
    }
  }
}
