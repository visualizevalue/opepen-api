import Rand from 'rand-seed'

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from(
    { length: Math.ceil(arr.length / size) },
    (_: any, i: number) => arr.slice(i * size, i * size + size)
  )
}

/**
 * Take a random item from an array.
 *
 * @param {array} arr The Array to select a random element from.
 * @param {number} randomNumber A random number between 0 and 1
 * @returns {mixed}
 */
export function takeRandom<T>(arr: Array<T>, randomNumber = Math.random()): T|null {
  if (! arr?.length) return null

  return arr[Math.floor(randomNumber * arr.length)]
}

export function shuffle<T>(arr: Array<T>, rand = new Rand('')): T[] {
  const shuffled = [...arr] // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand.next() * (i + 1)); // Get a random index
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] // Swap elements
  }
  return shuffled
}

