import { DateTime } from 'luxon'
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
import Event from 'App/Models/Event'
import Image from 'App/Models/Image'
import Opepen from 'App/Models/Opepen'
import TokenModel from 'App/Models/TokenModel'
import { ContractType } from './types'

type BurnedOpepenData = {
  name: string
  image: string
}

export default class BurnedOpepen extends TokenModel {
  public contractName: ContractType = 'BURNED_OPEPEN'
  public contractAddress: string = Env.get('BURNED_OPEPEN_ADDRESS')

  @column({
    serializeAs: 'metadata',
  })
  public data: BurnedOpepenData

  @computed()
  public get name() {
    return this.data.name
  }

  @column()
  public imageId: bigint | null

  @column.dateTime()
  public burnedAt: DateTime

  @hasOne(() => Opepen, {
    foreignKey: 'burnedOpepenId',
    onQuery: (query) => query.preload('image'),
  })
  public opepen: HasOne<typeof Opepen>

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

  @hasMany(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: (query) => {
      query.where('contract', 'BURNED_OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
    },
  })
  public events: HasMany<typeof Event>

  @hasOne(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: (query) => {
      query.where('contract', 'BURNED_OPEPEN')
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

  public async updateImage() {
    const burnedOpepen: BurnedOpepen = this
    let uri: string = this.data.image?.replace('ipfs://', 'https://ipfs.vv.xyz/ipfs/')

    try {
      await burnedOpepen.load('image')
    } catch (e) {}

    if (!burnedOpepen.image) {
      const image = await Image.fromURI(uri)
      await image.generateScaledVersions()
      await image.save()

      burnedOpepen.imageId = image.id
      await burnedOpepen.save()
    } else {
      await burnedOpepen.image.updateImage(uri)
    }
  }
}
