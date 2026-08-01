export function isImageSelectionUnique(
  imageIds: (bigint | number | string | null | undefined)[],
) {
  const selectedImageIds = imageIds
    .filter((imageId) => imageId !== null && imageId !== undefined)
    .map(String)

  return new Set(selectedImageIds).size === selectedImageIds.length
}
