import Env from '@ioc:Adonis/Core/Env'
import { beforeSave, BelongsTo, belongsTo, column, computed, HasMany, hasMany, hasOne, HasOne } from '@ioc:Adonis/Lucid/Orm'
import TokenModel from './TokenModel'
import Event from './Event'
import Image from './Image'
import { ContractType } from './types'
import Opepen from './Opepen'
import { DateTime } from 'luxon'

type BurnedOpepenData = {
  name: string,
  image: string,
}

export default class BurnedOpepen extends TokenModel {
  public contractName: ContractType = 'BURNED_OPEPEN'
  public contractAddress: string = Env.get('BURNED_OPEPEN_ADDRESS')

  @column({
    serialize: (value: BurnedOpepenData) => {
      return {
        ...value,
        setConfig: undefined,
      }
    }
  })
  public data: BurnedOpepenData

  @computed()
  public get name () {
    return this.data.name
  }

  @column()
  public imageId: bigint | null

  @column.dateTime()
  public burnedAt: DateTime

  @hasOne(() => Opepen, {
    foreignKey: 'burnedOpepenId',
  })
  public opepen: HasOne<typeof Opepen>

  @belongsTo(() => Image)
  public image: BelongsTo<typeof Image>

  @hasMany(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: query => {
      query.where('contract', 'BURNED_OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
    }
  })
  public events: HasMany<typeof Event>

  @hasOne(() => Event, {
    foreignKey: 'tokenId',
    localKey: 'tokenId',
    onQuery: query => {
      query.where('contract', 'BURNED_OPEPEN')
      query.orderBy('blockNumber', 'desc')
      query.orderBy('logIndex', 'desc')
      query.limit(1)
    }
  })
  public lastEvent: HasOne<typeof Event>

  @beforeSave()
  public static async lowerCaseAddresses(model: TokenModel) {
    return TokenModel.lowerCaseAddresses(model)
  }

  public async updateImage () {
    const burnedOpepen: BurnedOpepen = this
    let uri: string = this.data.image?.replace('ipfs://', 'https://ipfs.vv.xyz/ipfs/')

    try {
      await burnedOpepen.load('image')
    } catch (e) {}

    if (! burnedOpepen.image) {
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
