import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import SetModel from 'App/Models/SetModel'
import TokenMigration from 'App/Models/TokenMigration'
import { DateTime } from 'luxon'
import DailyOpepen from 'App/Services/DailyOpepen'
import { Account } from 'App/Models'
import SubscriptionHistory from 'App/Models/SubscriptionHistory'
import Subscription from 'App/Models/Subscription'
import MetadataParser from 'App/Services/Metadata/MetadataParser'
import OpepenRenderer from 'App/Frames/OpepenRenderer'
import OpepenGrid from 'App/Services/OpepenGrid'

export default class OpepenController extends BaseController {
  public async list({ request }: HttpContextContract) {
    const { page = 1, limit = 24, filter = {}, includes = [], sort = '' } = request.qs()

    const query = Opepen.query().preload('image')

    await this.applyIncludes(query, includes)
    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    query.orderBy('tokenId', 'asc')

    return query.paginate(page, limit)
  }

  public async show({ params }: HttpContextContract) {
    const opepen = await Opepen.query()
      .where('tokenId', params.id)
      .preload('set')
      .preload('ownerAccount')
      .preload('image')
      .preload('lastEvent')
      .firstOrFail()

    const metadata = await new MetadataParser().forOpepen(opepen)

    return { ...opepen.toJSON(), metadata }
  }

  // v5 — global forward-migration feed (most recent first). Powers the timeline
  // and any "migrations to date" surfaces.
  public async recentMigrations({ request }: HttpContextContract) {
    const { limit = 50 } = request.qs()

    const migrations = await TokenMigration.query()
      .preload('fromSet', (q) => q.preload('submission'))
      .preload('toSet', (q) => q.preload('submission'))
      .orderBy('migratedAt', 'desc')
      .limit(Math.min(Number(limit), 200))

    return migrations.map((m) => ({
      token_id: Number(m.tokenId),
      from_set_id: m.fromSetId,
      from_set_name: m.fromSet?.submission?.name ?? null,
      to_set_id: m.toSetId,
      to_set_name: m.toSet?.submission?.name ?? null,
      migrated_at: m.migratedAt,
    }))
  }

  // v5 — forward-only migration lineage. Returns a token's set history as an
  // ordered list of steps (genesis → … → current), matching the frontend
  // `MigrationHistory` shape. A never-migrated token returns genesis + current.
  public async migrations({ params }: HttpContextContract) {
    const opepen = await Opepen.query()
      .where('tokenId', params.id)
      .preload('set', (q) => q.preload('submission'))
      .firstOrFail()

    const migrations = await TokenMigration.query()
      .where('tokenId', params.id)
      .preload('fromSet', (q) => q.preload('submission'))
      .preload('toSet', (q) => q.preload('submission'))
      .orderBy('migratedAt', 'asc')

    type Step = {
      set_id: number | null
      set_name: string
      reveals_at: DateTime | null
      current: boolean
    }

    const step = (set: SetModel | null): Step => ({
      set_id: set?.id ?? null,
      set_name: set?.submission?.name ?? (set ? `Set ${set.id}` : 'Unrevealed'),
      reveals_at: set?.submission?.revealsAt ?? null,
      current: false,
    })

    // Genesis: every Opepen starts blank.
    const steps: Step[] = [
      { set_id: null, set_name: 'Unrevealed', reveals_at: null, current: false },
    ]

    if (migrations.length) {
      // The first migration's `fromSet` is the original revealed set, then each
      // migration's `toSet` in order.
      steps.push(step(migrations[0].fromSet))
      for (const m of migrations) steps.push(step(m.toSet))
    } else if (opepen.revealedAt && opepen.set) {
      steps.push(step(opepen.set))
    }

    // Mark the present state.
    if (opepen.revealedAt) {
      steps[steps.length - 1].current = true
    } else {
      steps[0].current = true
    }

    return { token_id: Number(opepen.tokenId), edition: opepen.data?.edition, steps }
  }

  public async updateImage(context: HttpContextContract) {
    const opepen = await Opepen.query().where('tokenId', context.params.id).firstOrFail()
    await opepen.updateImage()
    return this.show(context)
  }

  public async forAccount({ params, request }: HttpContextContract) {
    const { page = 1, limit = 16_000, filter = {}, includes = [], sort = '' } = request.qs()

    const account = await Account.byId(params.id).firstOrFail()

    const query = Opepen.query().where('owner', account.address).preload('image')

    if (filter.edition) {
      query.whereJsonSuperset('data', { edition: parseInt(filter.edition) })
      delete filter.edition
    }

    await this.applyIncludes(query, includes)
    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      .orderBy('setId')
      .orderByRaw(`(data->>'edition')::int`)
      .orderBy(`tokenId`)
      .paginate(page, limit)
  }

  public async summary({ params, response }: HttpContextContract) {
    const date = DateTime.fromISO(params.date).toUTC()
    const key = `daily-summaries/${date.toISODate()}.png`

    if (await Drive.exists(key)) {
      return response.redirect(`${Env.get('CDN_URL')}/${key}`)
    }

    const image = await DailyOpepen.render(date)
    await Drive.put(key, image, {
      contentType: 'image/png',
    })

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  async gridForAccount(ctx: HttpContextContract) {
    const { params, request, response } = ctx
    const account = await Account.byId(params.id).firstOrFail()

    const query = request.qs()
    const key = query.key || DateTime.now().toUnixInteger()
    const imagePath = `opepen-profile-grids/${params.id}-${key}.png`

    let image: Buffer
    if (await Drive.exists(imagePath)) {
      return await ctx.response.redirect(`${Env.get('CDN_URL')}/${imagePath}`)
    } else {
      const opepen = await Opepen.query()
        .where('owner', account.address)
        .preload('image')
        .orderBy('updatedAt', 'desc')

      image = await OpepenGrid.make(
        opepen.map((c) => c.tokenId.toString()),
        false,
        query.highlight?.split(','),
      )

      await Drive.put(imagePath, image, {
        contentType: 'image/png',
      })
    }

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  public async optInStats({ params }: HttpContextContract) {
    const opepenId = params.id

    const subscriptionHistory = await SubscriptionHistory.query()
      .whereRaw('opepen_ids @> ?', [JSON.stringify([opepenId])])
      .preload('submission')
      .preload('account', (query) => query.preload('pfp'))
      .orderBy('createdAt', 'asc')

    const submissions = new Set()
    const result = subscriptionHistory
      .filter((entry) => entry.submission && entry.isOptIn)
      .filter((entry) => {
        if (submissions.has(entry.submission.uuid)) {
          return false
        }
        submissions.add(entry.submission.uuid)
        return true
      })
      .map((entry) => ({
        submission: entry.submission,
        subscriber_account: entry.account,
        created_at: entry.createdAt,
      }))

    const liveSubscriptions = new Set(
      (
        await Subscription.query()
          .whereRaw('opepen_ids @> ?', [JSON.stringify([opepenId])])
          .preload('submission')
      )
        .filter((subscription) => subscription.submission?.isLive)
        .map((subscription) => subscription.submission.uuid),
    )

    const resultWithLiveStatus = result.map((entry) => ({
      ...entry,
      is_live: liveSubscriptions.has(entry.submission.uuid),
    }))

    return {
      total_opt_ins: result.length,
      total_live_opt_ins: resultWithLiveStatus.filter((entry) => entry.is_live).length,
      opt_in_history: resultWithLiveStatus,
    }
  }

  public async og({ request, params, response }: HttpContextContract) {
    const opepen = await Opepen.query()
      .where('tokenId', params.id)
      .preload('set', (query) => query.preload('submission'))
      .preload('ownerAccount')
      .preload('events')
      .preload('image')
      .firstOrFail()

    const image = await OpepenRenderer.render(opepen, request.method() === 'POST')

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }
}
