import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import Post from 'App/Models/Post'

export default class PostsController extends BaseController {

  public async list ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
    } = request.qs()

    const query = Post.query().preload('account')

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async create ({ request, session }: HttpContextContract) {
    const account = await Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()

    const post = await Post.create({
      address: account.address,
      body: request.input('body'),
      submissionId: request.input('submission_id', null),
    })

    return post
  }

}
