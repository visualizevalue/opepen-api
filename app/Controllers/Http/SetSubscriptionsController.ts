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

export default class SetSubscriptionsController extends BaseController {
  public async subscribe ({ params, request }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    const address = request.input('address')?.toLowerCase()
    const message = request.input('message')
    const signature = request.input('signature')
    const comment = request.input('comment', null)
    const verifiedAddress = ethers.utils.verifyMessage(message, signature)

    if (submission.revealBlockNumber) throw new Error(`Submission past timeout`)
    if (! submission.publishedAt) throw new Error(`Needs a valid submission`) // TODO: Maybe not use published, but approved or sth like that
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
    await Opepen.query().whereIn('tokenId', request.input('opepen')).update({
      submissionId: submission.id,
    })

    // Update subscription
    subscription.message = message
    subscription.signature = signature
    subscription.comment = comment
    subscription.opepenIds = request.input('opepen')
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
    await SubscriptionHistory.saveFor(subscription)

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

    if (filter?.comment === '!null') {
      query.whereNot('comment', '')
    }

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

    return Subscription.query()
      .where('address', params.account.toLowerCase())
      .where('submissionId', submission.id)
      .firstOrFail()
  }
}
