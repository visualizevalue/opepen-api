import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ParticipationImage from 'App/Models/ParticipationImage'
import SetSubmission from 'App/Models/SetSubmission'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import { isAdmin } from 'App/Middleware/AdminAuth'
import { DateTime } from 'luxon'
import NotAuthenticated from 'App/Exceptions/NotAuthenticated'
import NotAuthorized from 'App/Exceptions/NotAuthorized'
import BadRequest from 'App/Exceptions/BadRequest'
import Image from 'App/Models/Image'

export default class ParticipationImagesController extends BaseController {
  public async store({ request, session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase()
    if (!address) throw new NotAuthenticated()

    const submissionId: string | undefined = request.input('submissionId')
    const imageIds: string[] | undefined = request.input('imageIds')
    
    if (!submissionId) throw new BadRequest('submissionId is missing')
    if (!imageIds?.length) throw new BadRequest('imageIds array is missing or empty')

    const submission = await SetSubmission.query().where('uuid', submissionId).first()
    if (!submission) throw new BadRequest('Submission not found')
    if (!submission.openForParticipation) throw new BadRequest('This set is not open for participation')

    await Account.firstOrCreate({ address })

    const images = await Image.query().whereIn('uuid', imageIds)
    if (images.length !== imageIds.length) throw new BadRequest('No image not found')

    if (images.some(img => img.creator !== address)) {
      throw new NotAuthorized('You can only use images you uploaded')
    }

    const participationImages = await Promise.all(
      images.map(img => 
        ParticipationImage.create({
          setSubmissionId: submission.id,
          imageId: img.id,
          creatorAddress: address,
        })
      )
    )

    await Promise.all(participationImages.map(img => img.load('image')))

    return participationImages
  }

  public async destroy({ request, session }: HttpContextContract) {
    const address = session.get('siwe')?.address?.toLowerCase()
    if (!address) throw new NotAuthenticated()

    const { id } = request.params()
    const participationImage = await ParticipationImage.query()
      .where('id', id)
      .preload('setSubmission')
      .firstOrFail()

    const isCreator = participationImage.setSubmission.creator === address
    if (!isCreator && !isAdmin(address)) {
      throw new NotAuthorized('Only the set creator or an admin can delete participation images')
    }

    participationImage.deletedAt = DateTime.now()
    await participationImage.save()

    return { success: true }
  }
}
