import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import TestEmail from 'App/Mailers/TestEmail'
import SetSubmission from 'App/Models/SetSubmission'
import { isAddress } from 'ethers/lib/utils'
import { constants } from 'ethers'
import FarcasterData from 'App/Services/FarcasterData'

export default class AccountsController extends BaseController {

  public async artists ({ request }) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      sort = '-setSubmissionsCount,-profileCompletion',
    } = request.qs()

    const query = Account.query()
      .where('setSubmissionsCount', '>', 0)
      .preload('pfp')
      .preload('coverImage')

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async curators ({ request }) {
    const {
      page = 1,
      limit = 24,
      filter = {},
      sort = '-opepen_count,-profileCompletion',
    } = request.qs()

    const query = Account.query()
      .has('subscriptions')
      .withCount('opepen')
      .preload('pfp')
      .preload('coverImage')

    await this.applyFilters(query, filter)
    await this.applySorts(query, sort)

    return query.paginate(page, limit)
  }

  public async show ({ params }) {
    const id = decodeURIComponent(params.id.toLowerCase())
    const address = isAddress(id) ? id : constants.AddressZero

    const account = await Account.byId(id)
      .preload('coverImage')
      .preload('richContentLinks', query => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .withCount('opepen')
      .withCount('burnedOpepen')
      .first()

    if (! account) {
      return Account.firstOrCreate({ address })
    }

    account.updateNames()

    const response = account.toJSON()

    response.createdSets = await SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .preload('creatorAccount')
      .preload('coCreator1Account')
      .preload('coCreator2Account')
      .preload('coCreator3Account')
      .preload('coCreator4Account')
      .preload('coCreator5Account')
      .where((query) => {
        query.where('creator', account.address)
             .orWhere('coCreator_1', account.address)
             .orWhere('coCreator_2', account.address)
             .orWhere('coCreator_3', account.address)
             .orWhere('coCreator_4', account.address)
             .orWhere('coCreator_5', account.address)
      })
      .withScopes(scopes => {
        scopes.approved()
        scopes.published()
      })
      .orderBy('created_at', 'desc')

    return response
  }

  public async update ({ params }) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    await account.updateNames()
    await account.updateProfileCompletion()

    return account
  }

  public async testMail ({ params, response }: HttpContextContract) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    if (! account.email) {
      return response.badRequest(`User doesn't have an email.`)
    }

    return await new TestEmail(account).sendLater()
  }

  public async byFid ({ params }: HttpContextContract) {
    return FarcasterData.getAccount(params.fid)
  }

}
