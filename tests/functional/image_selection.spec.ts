import { test } from '@japa/runner'
import { hasDuplicateImageSelection } from 'App/Helpers/imageSelection'

test('detects duplicate image selections across slots', ({ assert }) => {
  assert.isTrue(hasDuplicateImageSelection([1n, 2n, 1n]))
  assert.isTrue(hasDuplicateImageSelection(['12', 12n]))
})

test('allows distinct and empty image selections', ({ assert }) => {
  assert.isFalse(hasDuplicateImageSelection([1n, 2n, null, undefined, 3n]))
  assert.isFalse(hasDuplicateImageSelection([null, null, undefined]))
})
