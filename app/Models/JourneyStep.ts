import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import { prepareBigIntJson } from 'App/Helpers/bigints'
import Journey from './Journey'

export default class JourneyStep extends BaseModel {
  @column({ isPrimary: true })
  public id: bigint

  @column()
  public journeyId: bigint

  @column()
  public prompt: string

  @column({
    prepare: prepareBigIntJson,
  })
  public config: object

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Journey)
  public journey: BelongsTo<typeof Journey>
}
