import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import Comment from 'App/Models/Comment'

export default class CommentsController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
    } = request.qs()

    const query = Comment.query().preload('account')

    this.applyFilters(query, filter)
    this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async create ({ request, session }: HttpContextContract) {
    const account = await Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()

    const comment = await Comment.create({
      address: account.address,
      body: request.input('body'),
      submissionId: request.input('submission_id', null),
    })

    return comment
  }

}
