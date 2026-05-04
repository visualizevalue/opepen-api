import { DateTime } from 'luxon'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { ResponseContract } from '@ioc:Adonis/Core/Response'
import Env from '@ioc:Adonis/Core/Env'
import Drive from '@ioc:Adonis/Core/Drive'
import { string } from '@ioc:Adonis/Core/Helpers'
import Account from 'App/Models/Account'
import Opepen from 'App/Models/Opepen'
import SetSubmission from 'App/Models/SetSubmission'
import AccountRenderer from 'App/Frames/AccountRenderer'
import SetDetailRenderer from 'App/Frames/SetDetailRenderer'
import SetEditionRenderer from 'App/Frames/SetEditionRenderer'
import SetMinimalRenderer from 'App/Frames/SetMinimalRenderer'
import SetOptStatusRenderer from 'App/Frames/SetOptStatusRenderer'
import SetOverviewRenderer from 'App/Frames/SetOverviewRenderer'
import SubmissionsGrid from 'App/Services/SubmissionsGrid'

export default class RenderController {
  public async accountImage({ params, response }: HttpContextContract) {
    const account = await Account.byId(params.id)
      .preload('pfp')
      .preload('coverImage')
      .firstOrFail()
    const opepen = await Opepen.query().where('owner', account.address).preload('image')

    const image =
      opepen?.length >= 2
        ? await AccountRenderer.renderWithOwnedOpepen(account)
        : await AccountRenderer.render(account)

    return this.imageResponse(image, response)
  }

  public async setsSummary({ request, params, response }: HttpContextContract) {
    const [from, to] = params.date.split('_')
    const fromDate = DateTime.fromISO(from)
    const toDate = DateTime.fromISO(to).endOf('day')

    const imagePath = `submissions-grids/${params.date}.png`

    let image: Buffer
    if (request.method() !== 'POST' && (await Drive.exists(imagePath))) {
      return response.redirect(`${Env.get('CDN_URL')}/${imagePath}`)
    } else {
      const submissions = await SetSubmission.query()
        .where('approved_at', '>', fromDate.toISO())
        .where('approved_at', '<=', toDate.toISO())
        .orderBy('approved_at')

      image = await SubmissionsGrid.make(submissions.map((submission) => submission.uuid))

      await Drive.put(imagePath, image, {
        contentType: 'image/png',
      })
    }

    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  public async setOg({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `og/sets/${submission.uuid}_${submission.name ? string.toSlug(submission.name) : 'unrevealed'}.png`

    if (request.method() !== 'POST' && (await Drive.exists(key))) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const image = await SetOverviewRenderer.render(submission)

    await this.saveImage(key, image)

    return this.imageResponse(image, response)
  }

  public async setSquare({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `/submissions/${submission.uuid}-${submission.setId || 'unrevealed'}_${string.toSlug(submission.name || 'unrevealed')}_overview.png`

    if (request.method() !== 'POST' && (await Drive.exists(key))) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const png = await SetDetailRenderer.render(submission)

    await this.saveImage(key, png)

    return this.imageResponse(png, response)
  }

  public async setMinimal({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `/submissions/${submission.uuid}-${submission.setId || 'unrevealed'}_${string.toSlug(submission.name || 'unrevealed')}_minimal.png`

    if (request.method() !== 'POST' && (await Drive.exists(key))) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const png = await SetMinimalRenderer.render(submission)

    await this.saveImage(key, png)

    return this.imageResponse(png, response)
  }

  public async setEditionSquare({ request, params, response }: HttpContextContract) {
    const submission = await SetSubmission.query().where('uuid', params.id).firstOrFail()
    const key = `frames/submissions/${submission.uuid}_${submission.name ? string.toSlug(submission.name) : 'unrevealed'}_${params.edition}.png`

    if (request.method() !== 'POST' && (await Drive.exists(key))) {
      return this.imageResponse(await Drive.get(key), response)
    }

    const png = await SetEditionRenderer.render({ submission, edition: params.edition })

    await this.saveImage(key, png)

    return this.imageResponse(png, response)
  }

  public async setOptInStatus({ response, params }: HttpContextContract) {
    const submission = await SetSubmission.findByOrFail('uuid', params.id)

    return this.imageResponse(await SetOptStatusRenderer.render({ submission }), response)
  }

  protected imageResponse(image: Buffer, response: ResponseContract) {
    return response
      .header('Content-Type', 'image/png')
      .header('Content-Length', Buffer.byteLength(image))
      .send(image)
  }

  protected saveImage(key, png) {
    return Drive.put(key, png, {
      contentType: 'image/png',
    })
  }
}
