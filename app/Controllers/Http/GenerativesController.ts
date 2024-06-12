import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Generative from 'App/Models/Generative'

export default class GenerativesController extends BaseController {

  public async create ({ request }: HttpContextContract) {
    const generative = await Generative.create({
      type: request.input('type'),
      code: request.input('code'),
    })

    return generative
  }

  public async show ({ params }: HttpContextContract) {
    return Generative.findOrFail(params.id)
  }

  public async update ({ params, request }: HttpContextContract) {
    const generative = await Generative.findOrFail(params.id)

    generative.merge({
      code: request.input('code'),
      name: request.input('name'),
    })

    return generative.save()
  }

}
