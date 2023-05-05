import { ethers } from 'ethers'
import Drive from '@ioc:Adonis/Core/Drive'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import SetModel from 'App/Models/Set'
import Subscription from 'App/Models/Subscription'
import BaseController from './BaseController'
import { DateTime } from 'luxon'
import Account from 'App/Models/Account'
import Opepen from 'App/Models/Opepen'

export default class SetsController extends BaseController {
  public async show ({ params }: HttpContextContract) {
    const set = await SetModel.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .where('id', params.id)
      .firstOrFail()

    return set
  }

  public async subscribe ({ params, request }: HttpContextContract) {
    const set = await SetModel.findOrFail(params.id)

    const address = request.input('address')?.toLowerCase()
    const message = request.input('message')
    const signature = request.input('signature')
    const verifiedAddress = ethers.utils.verifyMessage(message, signature)

    if (set.revealsAt < DateTime.now()) throw new Error(`Submission past reveal`)
    if (! set.name) throw new Error(`Needs a valid set`)
    if (! message) throw new Error(`Needs a message`)
    if (address !== verifiedAddress.toLowerCase()) throw new Error(`Address needs to be accurate`)

    await Account.updateOrCreate({ address }, {})

    const subscription = await Subscription.updateOrCreate({
      setId: set.id,
      address,
    }, {
      message,
      signature,
      opepenIds: request.input('opepen'),
      delegatedBy: request.input('delegated_by'),
      createdAt: DateTime.now(),
    })

    // Update opepen cache
    set.submittedOpepen = await set.opepensInSet()
    await set.save()

    return subscription
  }

  public async listSubscribers ({ params, request }: HttpContextContract) {
    const {
      page = 1,
      limit = 50,
    } = request.qs()

    return Subscription.query()
      .where('setId', params.id)
      .orderBy('createdAt', 'desc')
      .preload('account')
      .paginate(page, limit)
  }

  public async subscriptionForAccount ({ params }: HttpContextContract) {
    return Subscription.query()
      .where('address', params.account.toLowerCase())
      .where('setId', params.id)
      .firstOrFail()
  }

  public async cleanedSubmissions ({ params }: HttpContextContract) {
    const submissions = await Subscription.query().where('setId', params.id)

    const opepens: any[] = []

    for (const submission of submissions) {
      for (const tokenId of submission.opepenIds) {
        const opepen = await Opepen.findOrFail(tokenId)

        if (opepen.revealedAt) {
          console.log(`Skipping #${opepen.tokenId} cause it is already revealed`)
          continue
        }

        const signer = submission.address.toLowerCase()
        const delegators = submission.delegatedBy ? submission.delegatedBy.split(',').map(a => a.toLowerCase()) : []
        const allowedOwners = [signer, ...delegators]

        if (! allowedOwners.includes(opepen.owner)) {
          console.log(`Skipping #${opepen.tokenId} cause not held by valid owners anymore.`)
          continue
        }

        opepens.push({
          tokenId,
          holder: opepen.owner,
          edition: opepen.data.edition,
        })
      }
    }

    await Drive.put(
      `sets/${params.id}/${DateTime.now().toUnixInteger()}.json`,
      JSON.stringify(opepens, null, 4)
    )

    return opepens
  }

  public async opepen ({ params }: HttpContextContract) {
    return Opepen.query()
      .where('setId', params.id)
      .preload('image')
      .orderByRaw(`(data->>'edition')::int`)
      .orderBy('set_edition_id')
  }
}
