import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import TestEmail from 'App/Mailers/TestEmail'

export default class AccountsController extends BaseController {

  public async show ({ params }) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase()))
      .preload('coverImage')
      .preload('richContentLinks', query => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .preload('createdSets')
      .first()

    if (! account) {
      return Account.create({ address: params.id })
    }

    account.updateNames()

    return account
  }

  public async update ({ params }) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    await account.updateNames()

    return account
  }

  public async testMail ({ params, response }: HttpContextContract) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    if (! account.email) {
      return response.badRequest(`User doesn't have an email.`)
    }

    return await new TestEmail(account).sendLater()
  }

}
