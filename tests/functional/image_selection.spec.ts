import { test } from '@japa/runner'
import { isImageSelectionUnique } from 'App/Helpers/imageSelection'

test('rejects repeated image selections across slots', ({ assert }) => {
  assert.isFalse(isImageSelectionUnique([1n, 2n, 1n]))
  assert.isFalse(isImageSelectionUnique(['12', 12n]))
})

test('accepts distinct and empty image selections', ({ assert }) => {
  assert.isTrue(isImageSelectionUnique([1n, 2n, null, undefined, 3n]))
  assert.isTrue(isImageSelectionUnique([null, null, undefined]))
})
