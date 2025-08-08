import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Bid extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public orderHash: string

  @column()
  public bidder: string

  @column({
    consume(amount: any) {
      if (!amount) return null
      return BigInt(amount)
    },
    prepare(amount: BigInt) {
      if (!amount) return null
      return amount.toString()
    },
  })
  public amount: BigInt | null

  @column()
  public currency: string

  @column({
    columnName: 'token_ids',
    prepare: (value: number[] | null) => (value ? value.join(',') : null),
    consume: (value: string | null) =>
      value ? value.split(',').map((id) => parseInt(id)) : null,
  })
  public tokenIds: number[] | null

  @column()
  public tokenAmount: number | null

  @column.dateTime()
  public startTime: DateTime

  @column.dateTime()
  public endTime: DateTime

  public get amountInEth() {
    if (!this.amount) return '0'
    const { ethers } = require('ethers')
    return ethers.utils.formatEther(this.amount.toString())
  }

  public serialize() {
    return {
      ...this.$attributes,
      amountInEth: this.amountInEth,
    }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
