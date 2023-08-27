import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import Opepen from './Opepen'
import Subscription from './Subscription'
import { EditionSize } from './types'

type EditionGroups = { [K in EditionSize]: BigInt[] }
export type SubmissionStats = {
  holders: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  opepens: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  demand: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  totalHolders?: number
}

export default class SetModel extends BaseModel {
  public static table = 'sets'

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public artist: string

  @column()
  public description: string

  @column()
  public minSubscriptionPercentage: number

  @column()
  public isDynamic: boolean = false

  @column()
  public revealStrategy: string

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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime()
  public revealsAt: DateTime

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

  @column()
  public submissionStats: SubmissionStats

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

  @hasMany(() => Opepen)
  public opepen: HasMany<typeof Opepen>

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
    await this.cleanSubmissions()
    this.submittedOpepen = await this.opepensInSet()
    await this.computeTotalHoldersAtReveal()
    await this.save()
  }

  public async cleanSubmissions () {
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

        submission.maxReveals[edition] = (
          typeof submission.maxReveals[edition] === 'number' &&
          overallocated
        )
          ? submission.maxReveals[edition]
          : overallocated && edition === '1'
            ? 1
            : opepenCount

        if (submission.maxReveals[edition] > 0) {
          holders[edition] ++
        }

        const max = Math.min(submission.maxReveals[edition], opepenCount)

        demand[edition] += max
        demand.total += max
        opepens[edition] += opepenCount
        opepens.total += opepenCount
      }

      holders.total ++

      await submission.save()
    }

    this.submissionStats = { ...this.submissionStats, holders, opepens, demand }
    await this.save()
  }

  public async computeTotalHoldersAtReveal () {
    const owners = await Opepen.holdersAtBlock(parseInt(this.revealBlockNumber) || 9999999999999999)

    this.submissionStats = { ...this.submissionStats, totalHolders: owners.size }
    await this.save()

    return owners.size
  }
}
