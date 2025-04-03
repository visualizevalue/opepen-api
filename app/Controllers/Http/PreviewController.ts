import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseController from './BaseController'
import Generative from 'App/Models/Generative'

export default class PreviewController extends BaseController {
  public async p5({ params, view }: HttpContextContract) {
    const generative = await Generative.findOrFail(params.id)

    return view.render('generative/p5', {
      code: generative.code,
    })
  }

  public async three({ view }: HttpContextContract) {
    return view.render('generative/three')
  }
}
