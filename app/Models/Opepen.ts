import Env from '@ioc:Adonis/Core/Env'
import { beforeSave, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import TokenModel from './TokenModel'
import Event from './Event'
import SetModel from './Set'
import Image from './Image'
import { ContractType } from './types'

type OpepenData = {
  edition: 1|4|5|10|20|40,
}

export default class Opepen extends TokenModel {
  public contractName: ContractType = 'OPEPEN'
  public contractAddress: string = Env.get('OPEPEN_ADDRESS')

  @column()
  public data: OpepenData

  @column()
  public setId: number

  @column()
  public setEditionId: number

  @column()
  public imageId: bigint

  @belongsTo(() => SetModel)
  public set: BelongsTo<typeof SetModel>

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

  @hasMany(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: query => {
      query.where('contract', 'OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
    }
  })
  public events: HasMany<typeof Event>

  @beforeSave()
  public static async lowerCaseAddresses(model: TokenModel) {
    return TokenModel.lowerCaseAddresses(model)
  }
}
