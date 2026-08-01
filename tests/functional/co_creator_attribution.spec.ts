import { test } from '@japa/runner'
import {
  hasCoCreatorAttribution,
  selectedContributorAddresses,
  selectedImageIds,
} from 'App/Helpers/coCreatorAttribution'
import ParticipationImage from 'App/Models/ParticipationImage'
import SetSubmission from 'App/Models/SetSubmission'

const contributorA = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const contributorB = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const creator = '0xcccccccccccccccccccccccccccccccccccccccc'

test('keeps a contributor attributed until their last selected piece is removed', ({
  assert,
}) => {
  const participations = [
    { imageId: 1n, creatorAddress: contributorA },
    { imageId: 2n, creatorAddress: contributorA },
    { imageId: 3n, creatorAddress: contributorB },
  ] as ParticipationImage[]

  assert.deepEqual(selectedContributorAddresses(creator, [1n, 2n, 3n], participations), [
    contributorA,
    contributorB,
  ])
  assert.deepEqual(selectedContributorAddresses(creator, [2n, 3n], participations), [
    contributorA,
    contributorB,
  ])
  assert.deepEqual(selectedContributorAddresses(creator, [3n], participations), [contributorB])
})

test('keeps manual credit after automatic contribution credit is removed', ({ assert }) => {
  assert.isTrue(hasCoCreatorAttribution(true, true))
  assert.isTrue(hasCoCreatorAttribution(true, false))
  assert.isTrue(hasCoCreatorAttribution(false, true))
  assert.isFalse(hasCoCreatorAttribution(false, false))
})

test('deduplicates participation records and excludes the original creator', ({ assert }) => {
  const participations = [
    { imageId: 1n, creatorAddress: contributorA },
    { imageId: 1n, creatorAddress: contributorA.toUpperCase() },
    { imageId: 2n, creatorAddress: creator },
  ] as ParticipationImage[]

  assert.deepEqual(selectedContributorAddresses(creator, [1n, 2n], participations), [
    contributorA,
  ])
})

test('reads the final selected image ids from print and dynamic submissions', ({ assert }) => {
  const printSubmission = {
    editionType: 'PRINT',
    edition_1ImageId: 1n,
    edition_4ImageId: 4n,
    edition_5ImageId: null,
    edition_10ImageId: 10n,
    edition_20ImageId: null,
    edition_40ImageId: 40n,
  } as unknown as SetSubmission
  const dynamicSubmission = {
    editionType: 'DYNAMIC',
    edition_1ImageId: 1n,
    dynamicSetImages: {
      image_1_1_id: 999n,
      image_4_1_id: 4n,
      image_4_2_id: 5n,
    },
  } as unknown as SetSubmission

  assert.deepEqual(selectedImageIds(printSubmission), [1n, 4n, 10n, 40n])
  assert.deepEqual(selectedImageIds(dynamicSubmission), [1n, 4n, 5n])
})
