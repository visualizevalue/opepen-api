// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'

export default class AccountsController extends BaseController {

  public async show ({ params }) {
    return Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()
  }

  public async update ({ params }) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()

    await account.updateNames()

    return account
  }

}
