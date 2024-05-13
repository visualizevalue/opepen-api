import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { isAdmin } from 'App/Middleware/AdminAuth'
import BaseController from './BaseController'
import TimelineUpdate from 'App/Models/TimelineUpdate'

export default class TimelineController extends BaseController {

  public async list ({ request, session }: HttpContextContract) {
    const admin = isAdmin(session)
    const userAddress = session.get('siwe')?.address?.toLowerCase() || ''
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
    } = request.qs()

    const query = TimelineUpdate.query()
      // Main relationship...
      .preload('account')
      // Attached to...
      .preload('submission')
      .preload('subscriptionHistory')
      .preload('event')
      .preload('post')
      .preload('cast')

    // Restrict items
    query
      .whereNotNull('createdAt')
      .where(query => {
        query.where('type', 'POST:INTERNAL')
        query.whereHas('post', query => {
          // Filter out comments // FIXME: maybe not do this and display comments nicely?
          query.whereNull('parentPostId')

          // Filter out deleted comments
          query.whereNull('deletedAt')

          if (! admin) {
            query.whereNotNull('approvedAt')
                .orWhere('address', userAddress)
          }
        })
      })
      .orWhere(query => {
        query.where('type', 'POST:FARCASTER')
        query.whereHas('cast', query => {
          if (! admin) {
            query.whereNotNull('approvedAt')
                .orWhere('address', userAddress)
          }
        })
      })
      .orWhere('type', 'SET_SUBMISSION:PUBLISH')
      .orWhere('type', 'SET_SUBMISSION:OPT_IN')

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      // Fix sort pagination
      .orderBy('id')
      .paginate(page, limit)
  }

}
