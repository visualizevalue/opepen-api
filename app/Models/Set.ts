import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'
import Opepen from './Opepen'
import Subscription from './Subscription'

export default class SetModel extends BaseModel {
  public static table = 'sets'

  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public artist: string

  @column()
  public minSubscriptionPercentage: number

  @column()
  public isDynamic: boolean = false

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
    }
  })
  public submittedOpepen: object

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
        console.log(`added ${opepen.tokenId}`)
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
}
