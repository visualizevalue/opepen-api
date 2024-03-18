import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import SetSubmission from 'App/Models/SetSubmission'
import Subscription from 'App/Models/Subscription'
import BaseController from './BaseController'

export default class SetSubscriptionsController extends BaseController {
  public async subscribe ({ params, request }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    const address = request.input('address')?.toLowerCase()
    const message = request.input('message')
    const signature = request.input('signature')
    const comment = request.input('comment', null)
    const verifiedAddress = ethers.utils.verifyMessage(message, signature)

    if (submission.revealsAt < DateTime.now()) throw new Error(`Submission past reveal`)
    if (! submission.publishedAt) throw new Error(`Needs a valid submission`) // TODO: Maybe not use published, but approved or sth like that
    if (! message) throw new Error(`Needs a message`)
    if (address !== verifiedAddress.toLowerCase()) throw new Error(`Address needs to be accurate`)

    const account = await Account.updateOrCreate({ address }, {})
    account.updateNames()

    const subscription = await Subscription.updateOrCreate({
      submissionId: submission.id,
      address,
    }, {
      message,
      signature,
      comment,
      opepenIds: request.input('opepen'),
      maxReveals: request.input('max_reveals'),
      delegatedBy: request.input('delegated_by'),
      createdAt: DateTime.now(),
    })

    // Update opepen cache
    submission.updateAndValidateOpepensInSet()

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

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    if (filter?.comment === '!null') {
      query.whereNot('comment', '')
    }

    return query.orderBy('createdAt', 'desc')
      .preload('account')
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
