import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Account from 'App/Models/Account'
import BaseController from './BaseController'
import TestEmail from 'App/Mailers/TestEmail'
import NotifyNewSetEmail from 'App/Mailers/NotifyNewSetEmail'
import SetModel from 'App/Models/SetModel'

export default class AccountsController extends BaseController {

  public async show ({ params }) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase()))
      .preload('coverImage')
      .preload('richContentLinks', query => {
        query.preload('logo')
        query.preload('cover')
        query.orderBy('sortIndex')
      })
      .preload('createdSets', query => {
        query.preload('edition1Image')
        query.preload('edition4Image')
        query.preload('edition5Image')
        query.preload('edition10Image')
        query.preload('edition20Image')
        query.preload('edition40Image')
      })
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

  public async setNotification ({ params, response }: HttpContextContract) {
    const account = await Account.byId(decodeURIComponent(params.id.toLowerCase())).firstOrFail()
    const set = await SetModel.findOrFail(params.set)

    if (! account.email) {
      return response.badRequest(`User doesn't have an email.`)
    }
    if (! account.emailVerifiedAt) {
      return response.badRequest(`User email not verified.`)
    }
    if (! account.notificationNewSet) {
      return response.badRequest(`User has turned off set notifications.`)
    }

    return await new NotifyNewSetEmail(account, set).sendLater()
  }

}
