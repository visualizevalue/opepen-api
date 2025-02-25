import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import { Account } from 'App/Models'
import BaseController from './BaseController'
import Opepen from 'App/Models/Opepen'
import BurnedOpepen from 'App/Models/BurnedOpepen'
import OpepenGridGenerator from 'App/Services/OpepenGridGenerator'

export default class TokenController extends BaseController {

    public async gridForAccount({ params, request, response }: HttpContextContract) {
        const account = await Account.byId(params.id).firstOrFail()

        const query = request.qs()
        const key = query.key || DateTime.now().toUnixInteger()
        const imagePath = `opepen-profile-grids/${params.id}-${key}.png`

        if (await Drive.exists(imagePath)) {
            return response.redirect(`${Env.get('CDN_URL')}/${imagePath}`)
        }

        const normal = await Opepen.query().where('owner', account.address).preload('image')
        const burned = await BurnedOpepen.query().where('owner', account.address).preload('image')

        const allOpepen = [...normal, ...burned]

        allOpepen.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis())

        const highlightTokens = query.highlight ? query.highlight.split(',') : []

        const imageBuffer = await OpepenGridGenerator.make(allOpepen, false, highlightTokens)

        await Drive.put(imagePath, imageBuffer, {
            contentType: 'image/png',
        })

        return response
            .header('Content-Type', 'image/png')
            .header('Content-Length', Buffer.byteLength(imageBuffer))
            .send(imageBuffer)
    }
}
