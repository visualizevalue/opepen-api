export const formatNumber = (n: number) => n.toLocaleString('en-US')

export const pad = (num: number = 0, size: number = 2) => {
  let padded = num?.toString() || '0'
  while (padded.length < size) padded = '0' + padded
  return padded
}
