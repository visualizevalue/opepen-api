import Account from 'App/Models/Account'
import CoCreator from 'App/Models/CoCreator'
import ParticipationImage from 'App/Models/ParticipationImage'
import SetSubmission from 'App/Models/SetSubmission'
import type { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'

const EDITIONS = [1, 4, 5, 10, 20, 40] as const

type ImageId = bigint | number | string
type DatabaseClient = TransactionClientContract

const normalizeImageId = (id: ImageId) => id.toString()

export const selectedImageIds = (submission: SetSubmission): ImageId[] => {
  const selected = new Map<string, ImageId>()
  const add = (id: ImageId | null | undefined) => {
    if (id !== null && id !== undefined) selected.set(normalizeImageId(id), id)
  }

  add(submission.edition_1ImageId)

  if (submission.editionType === 'PRINT') {
    add(submission.edition_4ImageId)
    add(submission.edition_5ImageId)
    add(submission.edition_10ImageId)
    add(submission.edition_20ImageId)
    add(submission.edition_40ImageId)
  } else if (submission.dynamicSetImages) {
    for (const edition of EDITIONS.filter((edition) => edition !== 1)) {
      for (let index = 1; index <= edition; index++) {
        add(submission.dynamicSetImages[`image_${edition}_${index}_id`])
      }
    }
  }

  return [...selected.values()]
}

export const selectedContributorAddresses = (
  creatorAddress: string,
  imageIds: ImageId[],
  participations: Pick<ParticipationImage, 'imageId' | 'creatorAddress'>[],
) => {
  const selectedIds = new Set(imageIds.map(normalizeImageId))
  const originalCreator = creatorAddress.toLowerCase()

  return [
    ...new Set(
      participations
        .filter((participation) => selectedIds.has(normalizeImageId(participation.imageId)))
        .map((participation) => participation.creatorAddress.toLowerCase())
        .filter((address) => address !== originalCreator),
    ),
  ]
}

const coCreatorQuery = (submission: SetSubmission, client?: DatabaseClient) =>
  CoCreator.query(client ? { client } : undefined).where('setSubmissionId', submission.id)

export const hasCoCreatorAttribution = (isManual: boolean, isSelectedContributor: boolean) =>
  isManual || isSelectedContributor

const saveOrDeleteCoCreator = async (coCreator: CoCreator, client?: DatabaseClient) => {
  if (client) coCreator.useTransaction(client)

  if (hasCoCreatorAttribution(coCreator.isManual, coCreator.isSelectedContributor)) {
    await coCreator.save()
  } else {
    await coCreator.delete()
  }
}

export const reconcileManualCoCreators = async (
  submission: SetSubmission,
  requestedAddresses: string[],
  client?: DatabaseClient,
) => {
  const creatorAddress = submission.creator.toLowerCase()
  const addresses = [
    ...new Set(
      requestedAddresses
        .map((address) => address.toLowerCase())
        .filter((address) => address !== creatorAddress),
    ),
  ]
  const accounts = await Promise.all(
    addresses.map((address) =>
      Account.firstOrCreate({ address }, undefined, client ? { client } : undefined),
    ),
  )
  const manualAccountIds = new Set(accounts.map((account) => account.id.toString()))
  const existing = await coCreatorQuery(submission, client)
  const existingAccountIds = new Set(
    existing.map((coCreator) => coCreator.accountId.toString()),
  )

  for (const coCreator of existing) {
    coCreator.isManual = manualAccountIds.has(coCreator.accountId.toString())
    await saveOrDeleteCoCreator(coCreator, client)
  }

  for (const account of accounts) {
    if (existingAccountIds.has(account.id.toString())) continue

    await CoCreator.create(
      {
        setSubmissionId: submission.id,
        accountId: account.id,
        isManual: true,
        isSelectedContributor: false,
      },
      client ? { client } : undefined,
    )
  }
}

export const reconcileSelectedCoCreators = async (
  submission: SetSubmission,
  client?: DatabaseClient,
) => {
  const imageIds = selectedImageIds(submission)
  const participations = imageIds.length
    ? await (ParticipationImage.query(client ? { client } : undefined) as any)
        .where('setSubmissionId', submission.id)
        .whereIn('imageId', imageIds)
    : []
  const addresses = selectedContributorAddresses(submission.creator, imageIds, participations)
  const accounts = await Promise.all(
    addresses.map((address) =>
      Account.firstOrCreate({ address }, undefined, client ? { client } : undefined),
    ),
  )
  const selectedAccountIds = new Set(accounts.map((account) => account.id.toString()))
  const existing = await coCreatorQuery(submission, client)
  const existingAccountIds = new Set(
    existing.map((coCreator) => coCreator.accountId.toString()),
  )

  for (const coCreator of existing) {
    coCreator.isSelectedContributor = selectedAccountIds.has(coCreator.accountId.toString())
    await saveOrDeleteCoCreator(coCreator, client)
  }

  for (const account of accounts) {
    if (existingAccountIds.has(account.id.toString())) continue

    await CoCreator.create(
      {
        setSubmissionId: submission.id,
        accountId: account.id,
        isManual: false,
        isSelectedContributor: true,
      },
      client ? { client } : undefined,
    )
  }
}
