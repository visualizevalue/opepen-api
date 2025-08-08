import { generateSvg } from './opepen-svg.js'

const container = document.getElementById('opepen')
const config = new URLSearchParams(window.location.search)
const edition = parseInt(config.get('edition'))

const render = async () => {
  let bids = {}

  try {
    const response = await fetch(
      `https://api.opepen.art/v1/opepen/bids/set/76?address=0x0f0eae91990140c560d4156db4f00c854dc8f09e`,
    )
    const data = await response.json()

    Object.keys(data).forEach((edition) => {
      const amountWei = data[edition]
      if (amountWei && amountWei !== null) {
        const amountInEth = parseFloat((parseFloat(amountWei) / 1e18).toFixed(2))
        bids[parseInt(edition)] = amountInEth
      }
    })
  } catch (e) {
    console.error('Error fetching bids:', e)
    bids = {}
  }

  // fallback bid values
  const fallbackBids = {
    1: 6.9,
    4: 1.5,
    5: 1.0,
    10: 0.6,
    20: 0.5,
    40: 0.4,
  }

  let highestBid = bids[edition]

  // use fallback if no bid found or bid is null/0
  if (
    highestBid === null ||
    highestBid === undefined ||
    highestBid === 0 ||
    Object.keys(bids).length === 0
  ) {
    highestBid = fallbackBids[edition] || 0
  }

  const dimension = Math.min(window.innerWidth, window.innerHeight)

  const svgContent = await generateSvg({
    dimension,
    edition,
    bidAmount: parseFloat(highestBid.toFixed(2)),
  })

  container.innerHTML = svgContent
}

render()
