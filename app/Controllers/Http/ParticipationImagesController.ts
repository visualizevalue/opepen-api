import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import ParticipationImage from 'App/Models/ParticipationImage'
import SetSubmission from 'App/Models/SetSubmission'
import BaseController from './BaseController'
import Account from 'App/Models/Account'
import { isAdminAddress } from 'App/Middleware/AdminAuth'
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

    const submission = await SetSubmission.query().where('uuid', submissionId).firstOrFail()
    if (!submission.openForParticipation) throw new BadRequest('This set is not open for participation')

    await Account.firstOrCreate({ address })

    const images = await Image.query().whereIn('uuid', imageIds).where('creator', address)
    if (images.length !== imageIds.length) throw new BadRequest('At least one image not found')

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

    await this.updateCounts(submission.id)

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

    const isContributor = participationImage.creatorAddress === address
    const isSetCreator = participationImage.setSubmission.creator === address
    const isAdmin = isAdminAddress(address)
    
    if (!isSetCreator && !isContributor && !isAdmin) {
      throw new NotAuthorized('Only the set creator, the contributor, or an admin can delete participation images')
    }

    participationImage.deletedAt = DateTime.now()
    await participationImage.save()

    const submissionId = participationImage.setSubmissionId
    await this.updateCounts(submissionId)

    return { success: true }
  }

  private async updateCounts(submissionId: number) {
    const contributionsCount = await Database.from('participation_images')
      .where('set_submission_id', submissionId)
      .whereNull('deleted_at')
      .count('* as count')
      .first()

    const contributorsCount = await Database.from('participation_images')
      .where('set_submission_id', submissionId)
      .whereNull('deleted_at')
      .countDistinct('creator_address as count')
      .first()

    await SetSubmission.query()
      .where('id', submissionId)
      .update({
        contributions_count: contributionsCount?.count || 0,
        contributors_count: contributorsCount?.count || 0,
      })
  }
}
