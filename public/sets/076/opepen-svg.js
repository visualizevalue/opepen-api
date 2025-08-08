const svgCache = new Map()

async function loadSvg(path) {
  if (svgCache.has(path)) {
    return svgCache.get(path)
  }

  try {
    const response = await fetch(path)
    const svgText = await response.text()
    svgCache.set(path, svgText)
    return svgText
  } catch (error) {
    console.error(`Failed to load SVG: ${path}`, error)
    return null
  }
}

async function generateBidDisplay(
  bidAmount,
  targetWidth = 261,
  targetHeight = 108,
  edition = 1,
) {
  const bidStr = parseFloat(bidAmount).toFixed(2)
  const svgElements = []

  for (const char of bidStr) {
    if (char === '.') {
      svgElements.push(await loadSvg('./chips/numbers/point.svg'))
    } else {
      svgElements.push(await loadSvg(`./chips/numbers/${char}.svg`))
    }
  }

  const ethSvg = await loadSvg('./chips/eth.svg')
  if (ethSvg) {
    svgElements.push(ethSvg)
  }

  const standardHeight = 68.4
  const elements = []
  let totalWidth = 0

  for (let i = 0; i < svgElements.length; i++) {
    const svg = svgElements[i]
    if (!svg) continue

    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/)
    const originalWidth = viewBoxMatch ? parseFloat(viewBoxMatch[1].split(' ')[2]) : 20
    const originalHeight = viewBoxMatch ? parseFloat(viewBoxMatch[1].split(' ')[3]) : 68.4

    const isDecimalPoint = originalHeight < 30
    const isEthSuffix = i === svgElements.length - 1

    // calculate normalized width (except for decimal point)
    const width = isDecimalPoint
      ? originalWidth
      : (originalWidth / originalHeight) * standardHeight

    elements.push({
      svg,
      width,
      originalWidth,
      originalHeight,
      isDecimalPoint,
      isEthSuffix,
    })

    totalWidth += width
  }

  // add spacing - todo: REFINE
  const digitSpacing = 6
  const ethSpacing = 20
  let spacingTotal = 0

  for (let i = 0; i < elements.length - 1; i++) {
    spacingTotal += elements[i + 1].isEthSuffix ? ethSpacing : digitSpacing
  }

  totalWidth += spacingTotal

  const referenceWidth = standardHeight * 3
  const baseScale = targetWidth / referenceWidth
  const fitScale = targetWidth / totalWidth
  const scale = Math.min(baseScale, fitScale)

  const scaledWidth = totalWidth * scale
  const scaledHeight = standardHeight * scale
  const offsetX = (targetWidth - scaledWidth) / 2
  const offsetY = (targetHeight - scaledHeight) / 2 - targetHeight * 0.1

  const fillColor = edition === 4 ? '#0f0a06' : '#f4f4f4'
  let xPosition = offsetX
  let result = ''

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    const { svg, width, originalHeight, isDecimalPoint } = element

    const pathMatch = svg.match(/<path[^>]*\/?>/)
    if (!pathMatch) continue

    let path = pathMatch[0]
    if (path.includes('class="cls-1"')) {
      path = path.replace('class="cls-1"', `fill="${fillColor}"`)
    } else if (!path.includes('fill=')) {
      path = path.replace('<path', `<path fill="${fillColor}"`)
    } else {
      path = path.replace(/fill="[^"]*"/, `fill="${fillColor}"`)
    }

    let elementScale, yPosition

    if (isDecimalPoint) {
      elementScale = scale
      yPosition = offsetY + (standardHeight - originalHeight) * scale
    } else {
      elementScale = scale * (standardHeight / originalHeight)
      yPosition = offsetY
    }

    result += `<g transform="translate(${xPosition}, ${yPosition}) scale(${elementScale})">${path}</g>`

    if (i < elements.length - 1) {
      const spacing = elements[i + 1].isEthSuffix ? ethSpacing : digitSpacing
      xPosition += (width + spacing) * scale
    }
  }

  return result
}

export const generateSvg = async ({ dimension = 512, edition = 1, bidAmount = 0 } = {}) => {
  const chipSvg = await loadSvg(`./chips/1-${edition}.svg`)
  const bidDisplay = await generateBidDisplay(bidAmount, 261, 108, edition)

  let result = chipSvg

  if (result.includes('transform="translate(274, 419)"')) {
    result = result.replace(
      /<g transform="translate\(274, 419\)">\s*<\/g>/,
      `<g transform="translate(274, 419)">${bidDisplay}</g>`,
    )
  } else {
    result = result.replace(
      /<g class="cls-[13]" transform="translate\(279\.48 496\.48\)">\s*<\/g>/,
      (match) => {
        const classMatch = match.match(/class="(cls-[13])"/)
        const className = classMatch ? classMatch[1] : 'cls-3'
        return `<g class="${className}" transform="translate(279.48 496.48)">${bidDisplay}</g>`
      },
    )
  }

  result = result.replace(
    /width="800" height="800"/,
    `width="${dimension}" height="${dimension}"`,
  )

  if (!result.includes('viewBox')) {
    result = result.replace(/<svg([^>]*)>/, `<svg$1 viewBox="0 0 800 800">`)
  }

  return result
}
