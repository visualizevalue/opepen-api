import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import { beforeSave, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import OpenSea from 'App/Services/OpenSea'
import TokenModel from './TokenModel'
import Event from './Event'
import SetModel from './SetModel'
import Image from './Image'
import { ContractType } from './types'
import { TokenMetadata } from 'App/Services/Metadata/MetadataTypes'

type SetConfig = any

type OpepenData = {
  edition: 1|4|5|10|20|40,
  setConfig?: SetConfig,
  order?: {
    source: string,
    price: {
      raw: string,
      decimal: number,
      usd: number,
    }
  }
}

export default class Opepen extends TokenModel {
  public contractName: ContractType = 'OPEPEN'
  public contractAddress: string = Env.get('OPEPEN_ADDRESS')

  @column({
    serialize: (value: OpepenData) => {
      return {
        ...value,
        setConfig: undefined,
      }
    }
  })
  public data: OpepenData

  @column({
    serializeAs: null,
    consume: value => {
      if (! value) return {}

      return value
    }
  })
  public metadata: TokenMetadata

  @column()
  public setId: number

  @column()
  public setEditionId: number

  @column()
  public imageId: bigint

  @belongsTo(() => SetModel, {
    foreignKey: 'setId',
    onQuery: query => query.preload('submission')
  })
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

  public static async holdersAtBlock (block: number = 9999999999999999) {
    const lastTokenOwners = await Database.rawQuery(`SELECT
          DISTINCT on (token_id) token_id,
          "to" as holder,
          block_number
        FROM events
        WHERE block_number::NUMERIC < ?
        ORDER BY token_id, block_number::int desc`, [block])

    return new Set<string>(lastTokenOwners.rows.map(t => t.holder))
  }

  public async updateImage () {
    const response = await axios.get(`https://metadata.opepen.art/${this.tokenId}/image-uri`)

    const { uri } = response.data
    const gatewayURI = uri.replace('ipfs.io', Env.get('IPFS_GATEWAY'))

    Logger.info(`Opepen #${this.tokenId} image importing from: ${gatewayURI}`)
    const image = await Image.fromURI(gatewayURI)
    image.generateScaledVersions()

    this.imageId = image.id
    await this.save()

    await OpenSea.updateMetadata(this.tokenId.toString())
  }
}
