import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { string } from '@ioc:Adonis/Core/Helpers'
import Journey from 'App/Models/Journey'
import { ethers } from 'ethers'
import Account from 'App/Models/Account'
import BaseController from './BaseController'

export default class JourneysController extends BaseController {

  // TODO: Authenticate
  public async forAccount({ params, request }: HttpContextContract) {
    const account = await Account.byId(decodeURIComponent(params.id).toLowerCase()).firstOrFail()
    const {
      page = 1,
      limit = 24,
      filter = {},
    } = request.qs()

    const query = account.related('journeys').query()

    this.applyFilters(query, filter)

    query.orderBy('updated_at', 'desc')

    return query.paginate(page, limit)
  }


  // TODO: Authenticate
  public async show({ params }: HttpContextContract) {
    const journey = await Journey.findByOrFail('uuid', params.id)

    if (journey.mainImageId) await journey.load('mainImage')

    await journey.load('lastStep')

    return journey
  }

  // TODO: Authenticate, Validate request
  public async store({ request }: HttpContextContract) {
    const owner = await Account.firstOrCreate({ address: ethers.constants.AddressZero })

    // Create the journey
    const journey = await Journey.create({
      title: string.truncate(request.input('prompt'), 24),
      owner: owner.address,
    })

    // Create the first step
    await journey.related('steps').create({
      prompt: request.input('prompt'),
      config: request.input('config'),
    })

    // Load the initial step
    await journey.load('lastStep')

    return journey
  }

  // TODO: Authenticate, Validate request
  public async update({ request, params }: HttpContextContract) {
    const journey = await Journey.findByOrFail('uuid', params.id)

    journey.title = request.input('title', journey.title)
    journey.mainImageId = request.input('main_image_id', journey.mainImageId)

    return await journey.save()
  }

}
