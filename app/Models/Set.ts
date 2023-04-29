import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'

export default class Set extends BaseModel {
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
  public edition1Name: string
  @column()
  public edition4Name: string
  @column()
  public edition5Name: string
  @column()
  public edition10Name: string
  @column()
  public edition20Name: string
  @column()
  public edition40Name: string

  @column()
  public edition1ImageId: bigint
  @column()
  public edition4ImageId: bigint
  @column()
  public edition5ImageId: bigint
  @column()
  public edition10ImageId: bigint
  @column()
  public edition20ImageId: bigint
  @column()
  public edition40ImageId: bigint

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime()
  public revealsAt: DateTime

  @belongsTo(() => Image, { foreignKey: 'edition1ImageId' })
  public edition1Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition4ImageId' })
  public edition4Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition5ImageId' })
  public edition5Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition10ImageId' })
  public edition10Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition20ImageId' })
  public edition20Image: BelongsTo<typeof Image>
  @belongsTo(() => Image, { foreignKey: 'edition40ImageId' })
  public edition40Image: BelongsTo<typeof Image>
}
