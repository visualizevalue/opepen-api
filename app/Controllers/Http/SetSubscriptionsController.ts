import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import Subscription from 'App/Models/Subscription'
import BaseController from './BaseController'
import SubscriptionHistory from 'App/Models/SubscriptionHistory'
import Opepen from 'App/Models/Opepen'
import TimelineUpdate from 'App/Models/TimelineUpdate'

export default class SetSubscriptionsController extends BaseController {
  public async discard ({ params, session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase()

    const submission = await SetSubmission.findByOrFail('uuid', params.id)
    const existingSubscription = await Subscription.query().where({
      submission_id: submission.id,
      address,
    }).first()

    if (existingSubscription) throw new Error(`Please opt out manually`)

    return Subscription.create({
      address,
      submissionId: submission.id,
      message: 'DISCARD',
      opepenIds: [],
    })
  }

  public async subscribe ({ params, request }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    const address = request.input('address')?.toLowerCase()
    const message = request.input('message')
    const signature = request.input('signature')
    const verifiedAddress = ethers.utils.verifyMessage(message, signature)

    if (submission.revealBlockNumber) throw new Error(`Submission past timeout`)
    if (! submission.optInOpen()) throw new Error(`Submission not open for opt in`)
    if (! message) throw new Error(`Needs a message`)
    if (address !== verifiedAddress.toLowerCase()) throw new Error(`Address needs to be accurate`)

    const account = await Account.updateOrCreate({ address }, {})
    account.updateNames()

    const subscription = await Subscription.firstOrCreate({
      submissionId: submission.id,
      address,
    })

    // Remove opted out opepen
    if (subscription.opepenIds?.length) {
      await Opepen.query().whereIn('tokenId', subscription.opepenIds).update({
        submissionId: null,
      })
    }

    // Add opted in opepen
    const newOptIns = request.input('opepen')
    if (newOptIns?.length) {
      await Opepen.query().whereIn('tokenId', newOptIns).update({
        submissionId: submission.id,
      })

      submission.lastOptInAt = DateTime.now()
      submission.archivedAt = null
      await submission.save()
    }

    // Update subscription
    subscription.message = message
    subscription.signature = signature
    subscription.opepenIds = newOptIns
    subscription.maxReveals = request.input('max_reveals')
    subscription.delegatedBy = request.input('delegated_by')
    subscription.createdAt = DateTime.now()
    await subscription.save()

    // Clear other opt ins for these opepen
    const optedOpepenStr = subscription.opepenIds.join(',')
    await Database.rawQuery(`
      UPDATE set_subscriptions
      SET opepen_ids = opepen_ids - '{${optedOpepenStr}}'::text[]
      WHERE opepen_ids \\?| '{${optedOpepenStr}}'::text[]
      AND (
        submission_id != ${submission.id}
        OR address != '${subscription.address}'
      )
      AND submission_id NOT IN (SELECT submission_id FROM sets WHERE submission_id IS NOT NULL)
    `)

    // Save history
    const history = await SubscriptionHistory.saveFor(subscription)

    // Save timeline
    await TimelineUpdate.createFor(history)

    // Update opepen cache
    await submission.updateAndValidateOpepensInSet()

    return subscription
  }

  public async listSubscribers ({ params, request }: HttpContextContract) {
    const {
      page = 1,
      limit = 50,
      filter = {},
      sort = ''
    } = request.qs()

    const submission = await SetSubmission.findByOrFail('uuid', params.id)
    const query = Subscription.query().where('submissionId', submission.id)

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.orderBy('createdAt', 'desc')
      .preload('account')
      .paginate(page, limit)
  }

  public async globalHistory ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = ''
    } = request.qs()

    const query = SubscriptionHistory.query()

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.orderBy('createdAt', 'desc')
      .preload('account', query => query.preload('pfp'))
      .preload('submission')
      .whereNotNull('submissionId')
      .paginate(page, limit)
  }

  public async history ({ params, request }: HttpContextContract) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = ''
    } = request.qs()

    const submission = await SetSubmission.findByOrFail('uuid', params.id)
    const query = SubscriptionHistory.query().where('submissionId', submission.id)

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.orderBy('createdAt', 'desc')
      .preload('account', query => query.preload('pfp'))
      .paginate(page, limit)
  }

  public async forAccount ({ params }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    const subscription = await Subscription.query()
      .where('address', params.account.toLowerCase())
      .where('submissionId', submission.id)
      .firstOrFail()

    const opepen = await Opepen.query().whereIn('tokenId', subscription.opepenIds)
    const perEdition = opepen.reduce((acc, token) => {
      if (! acc[token.data.edition]) {
        acc[token.data.edition] = 0
      }

      acc[token.data.edition] += 1

      return acc
    }, {})

    return {
      ...(await subscription.toJSON()),
      per_edition: perEdition,
    }
  }
}
