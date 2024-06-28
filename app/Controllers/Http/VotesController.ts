import { constants } from 'ethers'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Image from 'App/Models/Image'
import Vote from 'App/Models/Vote'
import { Account } from 'App/Models'

export default class VotesController extends BaseController {

  public async create ({ request, session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase()
    const image = await Image.findByOrFail('uuid', request.input('image'))

    let vote = await Vote.query()
      .where('address', address)
      .where('imageId', image.id.toString())
      .first()

    // If the vote existed, remove its previous points
    if (vote) {
      image.points -= vote.points
    }

    // Create or update the vote
    vote = await Vote.updateOrCreate({
      address: address,
      imageId: image.id,
    }, {
      address: address,
      points: request.input('approve') === true ? 1 : -1,
      imageId: image.id,
    })

    // Calculate the new points based on the new vote
    image.points += vote.points

    await image.save()

    return vote
  }

  public async stats ({ session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase() || constants.AddressZero

    const [
      votesCount,
      votableCount
    ] = await Promise.all([
      Vote.query().where('address', address).count('id'),
      Image.votableQuery().count('id'),
    ])

    return {
      votes: votesCount[0].$extras.count,
      votable: votableCount[0].$extras.count,
    }
  }

  /**
   * Randomly select an image belonging to a set or a post.
   */
  public async votable ({ session }) {
    const address = session.get('siwe')?.address?.toLowerCase() || constants.AddressZero

    const image = await Image.votableQuery()
      // That we haven't voted on yet
      .whereDoesntHave('votes', query => query.where('votes.address', address))
      .orderByRaw('random()')
      .first()

    return image
  }

  public async leaderboard ({ request }: HttpContextContract) {
    const {
      page = 1,
      limit = 32,
    } = request.qs()

    return Account.query()
      .has('votes')
      .withCount('votes')
      .preload('pfp')
      .orderBy('votes_count', 'desc')
      .paginate(page, limit)
  }

}
