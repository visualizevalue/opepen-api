import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Image from './Image'

export default class PortfolioItem extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public address: string

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public logoImageId: bigint|null

  @column()
  public coverImageId: bigint|null

  @belongsTo(() => Image, {
    foreignKey: 'logoImageId',
  })
  public logo: BelongsTo<typeof Image>

  @belongsTo(() => Image, {
    foreignKey: 'coverImageId',
  })
  public cover: BelongsTo<typeof Image>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>
}
