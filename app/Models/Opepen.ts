import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import {
  beforeSave,
  BelongsTo,
  belongsTo,
  column,
  computed,
  HasMany,
  hasMany,
  hasOne,
  HasOne,
} from '@ioc:Adonis/Lucid/Orm'
import Database from '@ioc:Adonis/Lucid/Database'
import Logger from '@ioc:Adonis/Core/Logger'
import BurnedOpepen from 'App/Models/BurnedOpepen'
import Event from 'App/Models/Event'
import Image from 'App/Models/Image'
import SetModel from 'App/Models/SetModel'
import TokenModel from 'App/Models/TokenModel'
import OpenSea from 'App/Services/OpenSea'
import { TokenMetadata } from 'App/Services/Metadata/MetadataTypes'
import { ContractType } from './types'

type SetConfig = any

type OpepenData = {
  name: string
  edition: 1 | 4 | 5 | 10 | 20 | 40
  setConfig?: SetConfig
  order?: {
    source: string
    price: {
      raw: string
      decimal: number
      usd: number
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
    },
  })
  public data: OpepenData

  @column({
    consume: (value) => {
      if (!value) return {}

      return value
    },
  })
  public metadata: TokenMetadata

  @computed()
  public get name() {
    return this.data.name
  }

  @column()
  public setId: number

  @column()
  public setEditionId: number

  @column()
  public imageId: bigint | null

  @column()
  public burnedOpepenId: bigint | null

  @belongsTo(() => SetModel, {
    foreignKey: 'setId',
    onQuery: (query) => query.preload('submission'),
  })
  public set: BelongsTo<typeof SetModel>

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

  @belongsTo(() => BurnedOpepen, {
    foreignKey: 'burnedOpepenId',
  })
  public burnedOpepen: BelongsTo<typeof BurnedOpepen>

  @hasMany(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: (query) => {
      query.where('contract', 'OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
    },
  })
  public events: HasMany<typeof Event>

  @hasOne(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: (query) => {
      query.where('contract', 'OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
      query.limit(1)
    },
  })
  public lastEvent: HasOne<typeof Event>

  @beforeSave()
  public static async lowerCaseAddresses(model: TokenModel) {
    return TokenModel.lowerCaseAddresses(model)
  }

  public static async holdersAtBlock(block: number = 9999999999999999) {
    const lastTokenOwners = await Database.rawQuery(
      `SELECT
          DISTINCT on (token_id) token_id,
          "to" as holder,
          block_number
        FROM events
        WHERE block_number::NUMERIC < ?
        AND contract = 'OPEPEN'
        ORDER BY token_id, block_number::int desc`,
      [block],
    )

    return new Set<string>(lastTokenOwners.rows.map((t) => t.holder))
  }

  public async updateImage() {
    const opepen: Opepen = this
    let uri: string

    if (opepen.metadata.animation_url?.endsWith('.svg')) {
      uri = opepen.metadata.animation_url
    } else {
      const response = await axios.get(
        `https://metadata.opepen.art/${opepen.tokenId}/image-uri`,
      )

      uri = response.data.uri as string
    }
    const gatewayURI = uri
      .replace('https://ipfs.io', 'ipfs.io')
      .replace('http://ipfs.io', 'ipfs.io')
      .replace('ipfs.io', Env.get('IPFS_GATEWAY'))
      .replace('ipfs://', Env.get('IPFS_GATEWAY') + '/ipfs/')

    Logger.info(`Opepen #${opepen.tokenId} image importing from: ${gatewayURI}`)

    await opepen.load('image')
    await opepen.load('set')

    if (!opepen.image) {
      const image = await Image.fromURI(gatewayURI)
      await image.generateScaledVersions()

      if (opepen.set.submission.editionType === 'DYNAMIC') {
        image.opepenId = opepen.tokenId as bigint // maintain non normalized image relations cache
      }
      image.setSubmissionId = opepen.set.submission.id
      image.creator = opepen.set.submission.creator
      await image.save()

      opepen.imageId = image.id
      await opepen.save()
    } else {
      await opepen.image.updateImage(gatewayURI)
    }

    await OpenSea.updateMetadata(opepen.tokenId.toString())
  }

  public async updateName() {
    const opepen: Opepen = this
    const edition = opepen.data.edition
    const editionStr = `(Ed. ${edition})`

    if (!opepen.revealedAt) {
      opepen.data.name = `Unrevealed #${opepen.tokenId} ${editionStr}`
    } else {
      if (!opepen.$preloaded['set']) {
        await opepen.load('set')
      }
      const submission = opepen.set.submission

      opepen.data.name = `${submission.name}, ${submission[`edition_${edition}Name`]} ${editionStr}`
    }

    await opepen.save()
  }
}
