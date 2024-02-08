import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Opepen from './Opepen'
import { ContractType } from './types'

export default class Event extends BaseModel {
  public static table = 'events'

  @column({ isPrimary: true })
  public id: number

  @column()
  public tokenId: BigInt

  @column()
  public type: string

  @column()
  public contract: ContractType

  @column()
  public from: string

  @column()
  public to: string

  @column({
    consume (value: any) {
      if (! value) return null

      return BigInt(value)
    },

    prepare (value: BigInt) {
      if (! value) return null

      return value.toString()
    },
  })
  public value: BigInt

  get price () {
    return ethers.utils.formatEther(this.value.toString())
  }

  @column()
  public data: object

  @column()
  public transactionHash: string

  @column()
  public logIndex: string

  @column({ columnName: 'block_number' })
  public blockNumber: string

  @column.dateTime()
  public timestamp: DateTime

  @belongsTo(() => Account, {
    foreignKey: 'from',
    localKey: 'address',
  })
  public fromAccount: BelongsTo<typeof Account>

  @belongsTo(() => Account, {
    foreignKey: 'to',
    localKey: 'address',
  })
  public toAccount: BelongsTo<typeof Account>

  @belongsTo(() => Opepen, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
  })
  public opepen: BelongsTo<typeof Opepen>

  public static async getLastOfType (type: string, contract: ContractType) {
    try {
      return Event.query()
        .where('type', type)
        .where('contract', contract)
        .orderByRaw('block_number::int desc')
        .orderByRaw('log_index::int desc')
        .first()
    } catch (e) {
      return null
    }
  }
}
