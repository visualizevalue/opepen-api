import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import { isAdmin, isAdminAddress } from 'App/Middleware/AdminAuth'
import BaseController from './BaseController'
import Post from 'App/Models/Post'
import Image from 'App/Models/Image'
import BadRequest from 'App/Exceptions/BadRequest'
import TimelineUpdate from 'App/Models/TimelineUpdate'
import NotAuthorized from 'App/Exceptions/NotAuthorized'

export default class PostsController extends BaseController {

  public async list ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = 'createdAt',
    } = request.qs()

    const query = Post.query()
      .whereNull('deletedAt')
      // Main relationship...
      .preload('account')
      .preload('images')
      // Attached to...
      .preload('submission')
      .preload('opepen')
      .preload('parent')
      .preload('image')
      .withCount('commentsCount')

    // Apply default comment filter
    if (! filter[`parent_post_id`]) {
      query.whereNull('parentPostId')
    }

    // Filter non approved for non admins
    if (! isAdmin(session)) {
      query.where(q => {
        q.whereNotNull('approvedAt')

        const userAddress = session.get('siwe')?.address?.toLowerCase()
        if (userAddress) q.orWhere('address', userAddress)
      })
    }

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query
      // Fix sort pagination
      .orderBy('id')
      .paginate(page, limit)
  }

  public async listImagePosts ({ request, session }: HttpContextContract) {
    const {
      page = 1,
      limit = 10,
      filter = {},
      sort = '-createdAt',
    } = request.qs()

    const query = Post.query()
      .has('images')
      .whereNull('parentPostId')
      // Main relationship...
      .preload('account')
      .preload('images')
      // Attached to...
      .preload('submission')
      .preload('opepen')
      .preload('parent')
      .preload('image')

    // Filter non approved for non admins
    if (! isAdmin(session)) {
      query.whereNull('deletedAt')
      query.where(q => {
        q.whereNotNull('approvedAt')

        const userAddress = session.get('siwe')?.address?.toLowerCase()
        if (userAddress) q.orWhere('address', userAddress)
      })
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
      .whereNull('deletedAt')
      // Main relationship...
      .preload('account')
      .preload('images')
      // Attached to...
      .preload('submission')
      .preload('opepen')
      .preload('parent')
      .firstOrFail()
  }

  public async create ({ request, session }: HttpContextContract) {
    const account = await Account.query().where('address', session.get('siwe')?.address?.toLowerCase()).firstOrFail()

    // Gather basic data
    const parentPostId = request.input('parent_post_id', null)
    const body = request.input('body', null)
    const imageIds = request.input('image_ids', [])

    // Basic content validation
    if (! body && ! imageIds?.length) {
      throw new BadRequest(`Posts need content`)
    }

    // Auto-approve post
    const isApproved = isAdminAddress(account.address) || parentPostId

    // Create post
    const post = await Post.create({
      address: account.address,
      body: request.input('body'),
      imageId: request.input('image_id', null),
      opepenId: request.input('opepen_id', null),
      submissionId: request.input('submission_id', null),
      parentPostId,
      signature: request.input('signature', null),
      approvedAt: isApproved ? DateTime.now() : null,
    })

    // Attach images
    const images = await Image.query().whereIn('uuid', imageIds)
    await post.related('images').sync(images.map(i => i.id?.toString()))
    await post.load('images')

    // Save timeline item
    await TimelineUpdate.createFor(post)

    return post
  }

  public async approve (ctx: HttpContextContract) {
    const post = await this.show(ctx)

    post.approvedAt = DateTime.now()
    await post.save()

    return post
  }

  public async unapprove (ctx: HttpContextContract) {
    const post = await this.show(ctx)

    post.approvedAt = null
    await post.save()

    return post
  }

  public async destroy (ctx: HttpContextContract) {
    const post = await this.show(ctx)

    const currentAddress = ctx.session.get('siwe')?.address?.toLowerCase()
    if (post.address !== currentAddress && ! isAdmin(ctx.session)) {
      throw new NotAuthorized(`Only the owner can delete a post`)
    }

    post.deletedAt = DateTime.now()
    await post.save()

    return post
  }

}
