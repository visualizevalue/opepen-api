import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import { isAdmin } from 'App/Middleware/AdminAuth'
import BaseController from './BaseController'
import Post from 'App/Models/Post'
import Image from 'App/Models/Image'

export default class PostsController extends BaseController {

  public async list ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = 'createdAt',
    } = request.qs()

    const admin = isAdmin(session)

    const query = Post.query()
      // Main relationship...
      .preload('account')
      .preload('images')
      // Attached to...
      .preload('submission')
      .preload('opepen')
      .preload('parent')
      .preload('image')

    // Filter non approved for non admins
    if (! admin) {
      query.where('approvedAt', '<', DateTime.now().toISO())
    }

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      // Fix sort pagination
      .orderBy('id')
      .paginate(page, limit)
  }

  public async show ({ params }: HttpContextContract) {
    return Post.query()
      .where('uuid', params.id)
      // Main relationship...
      .preload('account')
      .preload('images')
      // Attached to...
      .preload('submission')
      .preload('opepen')
      .preload('parent')
  }

  public async create ({ request, session }: HttpContextContract) {
    const account = await Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()

    // Create post
    const post = await Post.create({
      address: account.address,
      body: request.input('body'),
      imageId: request.input('image_id', null),
      opepenId: request.input('opepen_id', null),
      submissionId: request.input('submission_id', null),
      parentPostId: request.input('parent_post_id', null),
      signature: request.input('signature', null),
    })

    // Attach images
    const images = await Image.query().whereIn('uuid', request.input('image_ids', []))
    await post.related('images').sync(images.map(i => i.id?.toString()))
    await post.load('images')

    return post
  }

}
