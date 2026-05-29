import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Opepen from 'App/Models/Opepen'
import SetModel from 'App/Models/SetModel'

// v5 — forward-only migration lineage.
// One row per time a revealed Opepen migrated forward into a new set, vacating
// its prior set. The ordered set of rows for a token is its evolutionary path.
export default class TokenMigration extends BaseModel {
  public static table = 'token_migrations'

  @column({ isPrimary: true })
  public id: bigint

  @column()
  public tokenId: number

  @column()
  public fromSetId: number | null

  @column()
  public toSetId: number

  @column()
  public fromSubmissionId: number | null

  @column()
  public toSubmissionId: number | null

  @column.dateTime()
  public migratedAt: DateTime

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Opepen, { foreignKey: 'tokenId', localKey: 'tokenId' })
  public opepen: BelongsTo<typeof Opepen>

  @belongsTo(() => SetModel, { foreignKey: 'fromSetId' })
  public fromSet: BelongsTo<typeof SetModel>

  @belongsTo(() => SetModel, { foreignKey: 'toSetId' })
  public toSet: BelongsTo<typeof SetModel>

  // Record a forward migration. Called from the reveal pipeline when a token
  // that is already revealed gets reassigned to a different set.
  public static async record({
    tokenId,
    fromSetId,
    toSetId,
    fromSubmissionId,
    toSubmissionId,
  }: {
    tokenId: number
    fromSetId: number | null
    toSetId: number
    fromSubmissionId?: number | null
    toSubmissionId?: number | null
  }) {
    return TokenMigration.create({
      tokenId,
      fromSetId,
      toSetId,
      fromSubmissionId: fromSubmissionId ?? null,
      toSubmissionId: toSubmissionId ?? null,
      migratedAt: DateTime.now(),
    })
  }
}
