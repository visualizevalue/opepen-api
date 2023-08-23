import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import SetModel from './Set'
import { MaxReveal } from './types'
import Database from '@ioc:Adonis/Lucid/Database'

export default class Subscription extends BaseModel {
  public static table = 'set_subscriptions'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public setId: number

  @column()
  public address: string

  @column()
  public delegatedBy: string

  @column()
  public message: string

  @column()
  public signature: string

  @column({
    prepare: value => JSON.stringify(value),
  })
  public opepenIds: number[]

  @column({
    prepare: value => JSON.stringify(value),
  })
  public maxReveals: MaxReveal

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @belongsTo(() => SetModel)
  public set: BelongsTo<typeof SetModel>

  @belongsTo(() => Account, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public account: BelongsTo<typeof Account>

  // TODO: Implement in reveal
  public static async clearRevealedOpepenFromSet (setId: number) {
    const optIns = await Database.rawQuery(`
      select
        t1.opt_in_id,
        array_agg(opepens.token_id) as opepen_ids
      from opepens
      inner join (
        select
          id as opt_in_id,
          (jsonb_array_elements("opepen_ids")->>0)::int as token_id
        from set_subscriptions
        where set_id = ?
      ) t1 on (opepens.token_id = t1.token_id)
      where opepens.set_id is not null
      group by opt_in_id
    `, [setId])

    for (const { opt_in_id, opepen_ids } of optIns.rows) {
      const optIn = await Subscription.findOrFail(opt_in_id)

      optIn.opepenIds = optIn.opepenIds.filter(id => ! opepen_ids.includes(id))

      await optIn.save()
    }

    const set = await SetModel.findOrFail(setId)
    set.updateAndValidateOpepensInSet()
  }
}
