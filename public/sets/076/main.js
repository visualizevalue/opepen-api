import { generateSvg } from './opepen-svg.js'

const container = document.getElementById('opepen')
const config = new URLSearchParams(window.location.search)
const edition = parseInt(config.get('edition'))

const getBids = async () => {
  try {
    const response = await fetch(
      `https://api.opepen.art/v1/opepen/bids/set/76?address=0x0f0eae91990140c560d4156db4f00c854dc8f09e`,
    )
    const data = await response.json()

    const bids = {}
    Object.keys(data).forEach((edition) => {
      const amountWei = data[edition]
      if (amountWei && amountWei !== null) {
        const amountInEth = parseFloat((parseFloat(amountWei) / 1e18).toFixed(2))
        bids[parseInt(edition)] = amountInEth
      }
    })

    return bids
  } catch (e) {
    console.error('Error fetching bids:', e)
    return {}
  }
}

const getOffer = async (tokenId) => {
  try {
    const response = await fetch(`https://api.opepen.art/v1/opepen/${tokenId}`)
    const data = await response.json()

    if (data.price) {
      // Convert price from WEI to ETH
      const priceInEth = parseFloat((parseFloat(data.price) / 1e18).toFixed(2))
      return priceInEth
    }

    return null
  } catch (e) {
    console.error('Error fetching offer:', e)
    return null
  }
}

const render = async () => {
  // fallback bid values
  const fallbackBids = {
    1: 6.9,
    4: 1.5,
    5: 1.0,
    10: 0.6,
    20: 0.5,
    40: 0.4,
  }

  let amount = 0

  if (edition === 1) {
    // For edition 1, use the offer price
    // Using tokenId 12903 as specified in the TODO comment
    const offerPrice = await getOffer(12903)
    amount = offerPrice !== null ? offerPrice : fallbackBids[edition]
  } else {
    // For editions 4, 5, 10, 20, and 40, use bids
    const bids = await getBids()
    const bidAmount = bids[edition]

    console.log(bids, bidAmount)

    // use fallback if no bid found or bid is null/0
    if (
      bidAmount === null ||
      bidAmount === undefined ||
      bidAmount === 0 ||
      Object.keys(bids).length === 0
    ) {
      amount = fallbackBids[edition] || 0
    } else {
      amount = bidAmount
    }
  }

  const dimension = Math.min(window.innerWidth, window.innerHeight)

  const svgContent = await generateSvg({
    dimension,
    edition,
    bidAmount: parseFloat(amount.toFixed(2)),
  })

  container.innerHTML = svgContent

  RENDERED = true
}

render()
