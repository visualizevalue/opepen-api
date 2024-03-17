import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Setting extends BaseModel {
  public static table = 'app_settings'

  @column({ isPrimary: true })
  public id: number

  @column()
  public key: string

  @column()
  public data: { [key: string]: any }

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
