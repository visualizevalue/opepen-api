export function hasDuplicateImageSelection(
  imageIds: (bigint | number | string | null | undefined)[],
) {
  const seen = new Set<string>()

  for (const imageId of imageIds) {
    if (imageId === null || imageId === undefined) continue

    const normalizedId = String(imageId)
    if (seen.has(normalizedId)) return true

    seen.add(normalizedId)
  }

  return false
}
