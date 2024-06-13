import { constants } from 'ethers'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Image from 'App/Models/Image'
import Vote from 'App/Models/Vote'

export default class VotesController extends BaseController {

  public async create ({ request }: HttpContextContract) {
    const image = await Image.findByOrFail('uuid', request.input('image'))

    const vote = await Vote.create({
      points: request.input('approve') === true ? 1 : -1,
      imageId: image.id,
    })

    image.points += vote.points
    await image.save()

    return vote
  }

  /**
   * Randomly select an image belonging to a set or a post.
   */
  public async votable ({ session }) {
    const address = session.get('siwe')?.address?.toLowerCase() || constants.AddressZero

    const image = await Image.query()
      // Belonging to...
      .where(query => {
        // ...a post
        query.whereHas('posts', query => query.whereNotNull('approved_at'))
        // ... an opepen
        query.orWhereExists(query => query.from('opepens').whereColumn('image_id', 'images.id'))
        // ...a set submission
        query.orWhereExists(query => query.from('set_submissions')
          .whereNotNull('approved_at')
          .where(query => query
            .whereColumn('set_submissions.edition_1_image_id', 'images.id')
            .orWhereColumn('set_submissions.edition_4_image_id', 'images.id')
            .orWhereColumn('set_submissions.edition_5_image_id', 'images.id')
            .orWhereColumn('set_submissions.edition_10_image_id', 'images.id')
            .orWhereColumn('set_submissions.edition_20_image_id', 'images.id')
            .orWhereColumn('set_submissions.edition_40_image_id', 'images.id')
          )
        )
      })
      // That we haven't voted on yet
      .whereDoesntHave('votes', query => query.where('votes.address', address))
      .orderByRaw('random()')
      .first()

    return image
  }

}
