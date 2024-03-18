import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Database from '@ioc:Adonis/Lucid/Database'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import { MaxReveal } from './types'

export default class Subscription extends BaseModel {
  public static table = 'set_subscriptions'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public submissionId: number

  @column()
  public address: string

  @column()
  public delegatedBy: string

  @column()
  public message: string

  @column()
  public signature: string

  @column()
  public comment: string

  @column({
    prepare: value => JSON.stringify(value),
  })
  public opepenIds: string[]

  @column({
    prepare: value => JSON.stringify(value),
  })
  public maxReveals: MaxReveal

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => SetSubmission)
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>

  public static async clearRevealingOpepenFromOtherSubmissions (submissionId: number) {
    const optedOpepen = await Database.rawQuery(`
      SELECT jsonb_array_elements_text("opepen_ids")
      FROM set_subscriptions
      WHERE submission_id = ${submissionId}
    `)
    const optedOpepenStr = optedOpepen.join(',')

    await Database.rawQuery(`
      UPDATE set_subscriptions
      SET opepen_ids = opepen_ids - '{${optedOpepenStr}}'::text[]
      WHERE opepen_ids ?| '{${optedOpepenStr}}'::text[]
      AND submission_id != ${submissionId}
    `)
  }
}
