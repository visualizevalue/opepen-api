import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, computed, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import abi from 'App/TokenStandards/abis/ERC721.json'
import provider from 'App/Services/RPCProvider'
import Account from 'App/Models/Account'
import Event from 'App/Models/Event'
import { ContractType } from './types'

export type Attribute = {
  trait_type: string,
  value: string|number,
}

export default abstract class TokenModel extends BaseModel {
  public contractName: ContractType
  public contractAddress: string

  @column({ isPrimary: true })
  public tokenId: BigInt

  @column()
  public owner: string

  @column()
  public attributeCount: number

  @column({
    prepare (value) {
      return JSON.stringify(value, null, 4)
    }
  })
  public attributes: Array<Attribute>

  @column({
    consume (price: any) {
      if (! price) return null

      return BigInt(price)
    },

    prepare (price: BigInt) {
      if (! price) return null

      return price.toString()
    },
  })
  public price: BigInt|null

  public get priceInEth () {
    if (!this.price) return '0'
    return ethers.utils.formatEther(this.price.toString())
  }

  @column()
  public offerTo: string

  @column()
  public data: object

  @column()
  public rarityRank: number|null

  @column({
    serializeAs: null,
  })
  public searchString: string

  @column.dateTime()
  public revealedAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get name () {
    return `${this.tokenId}`
  }

  public get isBurned () {
    return this.owner === ethers.constants.AddressZero
  }

  @belongsTo(() => Account, {
    foreignKey: 'owner',
    localKey: 'address',
    onQuery: query => query.preload('pfp')
  })
  public ownerAccount: BelongsTo<typeof Account>

  @hasMany(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: query => {
      query.where('contract', 'NAME')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
    }
  })
  public abstract events: HasMany<typeof Event>

  public static async lowerCaseAddresses(model: TokenModel) {
    model.owner = model.owner?.toLowerCase()
  }

  public async syncOwnerFromLastEvent () {
    const lastTransfer = await Event.query()
      .where('contract', this.contractName)
      .where('type', 'Transfer')
      .where('tokenId', this.tokenId.toString())
      .orderByRaw('block_number::int DESC')
      .orderByRaw('log_index::int DESC')
      .limit(1)
      .firstOrFail()

    this.owner = lastTransfer.to

    await (await this.updateSearchString()).save()
  }

  public async syncOwnerFromChain () {
    try {
      const contract = await new ethers.Contract(this.contractAddress, Array.from(abi), provider)
      const owner = (await contract.ownerOf(this.tokenId)).toLowerCase()
      this.owner = owner
    } catch (e) {
      this.owner = ethers.constants.AddressZero
    }

    await Account.updateOrCreate({ address: this.owner }, {})
    await this.save()
  }

  public async updateSearchString () {
    const account = await this.loadOwner()

    this.searchString = [
      `#${this.tokenId}`,
      this.owner,
      account.display,
    ].join(' ').toLowerCase()

    return this
  }

  public async loadOwner (force = false) {
    if (force) {
      await this.syncOwnerFromChain()
    }

    const model: TokenModel = this
    await model.load('ownerAccount')
    return model.ownerAccount
  }
}
