import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/SetModel'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import Database from '@ioc:Adonis/Lucid/Database'
import TokenMigration from 'App/Models/TokenMigration'
import OpepenService from 'App/Services/OpepenService'
import Account from 'App/Models/Account'

export default class SetsController extends BaseController {
  public async list() {
    return OpepenService.listSets()
  }

  public async show({ params }: HttpContextContract) {
    const set = await SetModel.query()
      .preload('submission')
      .preload('replacedSubmission')
      .where('id', params.id)
      .firstOrFail()

    // v5 — sets shrink as members migrate forward. Surface live membership and
    // how many have left, so the UI can show "shrank from 80 → N".
    const currentRow = await Database.from('opepens')
      .where('set_id', params.id)
      .count('* as count')
      .first()
    const migratedRow = await Database.from('token_migrations')
      .where('from_set_id', params.id)
      .count('* as count')
      .first()

    return {
      ...set.toJSON(),
      members_current: Number(currentRow?.count ?? 0),
      members_migrated_out: Number(migratedRow?.count ?? 0),
    }
  }

  public async stats({ params }: HttpContextContract) {
    return {
      floorListing: await Opepen.query()
        .whereNotNull('price')
        .where('setId', params.id)
        .orderBy('price')
        .first(),
    }
  }

  public async opepen({ params }: HttpContextContract) {
    return Opepen.query()
      .where('setId', params.id)
      .preload('image')
      .preload('ownerAccount')
      .orderByRaw(`(data->>'edition')::int`)
      .orderBy('set_edition_id')
  }

  public async collectors({ params }: HttpContextContract) {
    const collectors = await Account.query()
      .whereHas('opepen', (query) => {
        query.where('setId', params.id)
      })
      .withCount('opepen', (query) => {
        query.where('setId', params.id)
      })
      .preload('pfp')
      .orderBy('opepen_count', 'desc')

    return collectors
  }

  // v5 — provenance graph for a set: which Opepen left (and where they went),
  // and which arrived (and where they came from). Feeds the "this set fed into …"
  // and "migrated in from …" views.
  public async migrations({ params }: HttpContextContract) {
    const left = await TokenMigration.query()
      .where('fromSetId', params.id)
      .preload('toSet', (q) => q.preload('submission'))
      .orderBy('migratedAt', 'desc')

    const arrived = await TokenMigration.query()
      .where('toSetId', params.id)
      .preload('fromSet', (q) => q.preload('submission'))
      .orderBy('migratedAt', 'desc')

    return {
      out: left.map((m) => ({
        token_id: Number(m.tokenId),
        to_set_id: m.toSetId,
        to_set_name: m.toSet?.submission?.name ?? null,
        migrated_at: m.migratedAt,
      })),
      in: arrived.map((m) => ({
        token_id: Number(m.tokenId),
        from_set_id: m.fromSetId,
        from_set_name: m.fromSet?.submission?.name ?? null,
        migrated_at: m.migratedAt,
      })),
    }
  }
}
