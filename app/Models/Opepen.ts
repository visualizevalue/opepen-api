import Env from '@ioc:Adonis/Core/Env'
import { beforeSave, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import TokenModel from './TokenModel'
import Event from './Event'
import { ContractType } from './types'

export default class Opepen extends TokenModel {
  public contractName: ContractType = 'OPEPEN'
  public contractAddress: string = Env.get('OPEPEN_ADDRESS')

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
