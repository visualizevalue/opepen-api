import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class OpenGraphUrl extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public url: string

  @column()
  public title: string

  @column()
  public description: string

  @column()
  public image: string

  @column()
  public data: object

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  public updatedAt: DateTime
}
