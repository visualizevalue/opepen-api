import { vvrite } from './vv0.js'
import { editionSVG } from './edition-svg.js'

const container = document.getElementById('opepen')
const config  = new URLSearchParams(window.location.search)
const edition = parseInt(config.get('edition'))
const set = 69
const pad = (num = 0) => {
  let padded = num?.toString() || '0'
  while (padded.length < 3) padded = '0' + padded
  return padded
}

const render = async () => {
  let revealedSets
  let burned

  try {
    const response = await fetch(`https://api.opepen.art/v1/stats`)
    const data = await response.json()

    revealedSets = Math.max(69, data.revealed.sets)
    burned = data.optOuts.unrevealed
  } catch (e) {
    revealedSets = 69
    burned = 77
  }

  container.innerHTML = [
    `<header>`,
      vvrite(`opepen secret`),
      vvrite(`set ${pad(set)}`),
      vvrite(`edition 1/${edition}`),
    `</header>`,
    editionSVG({ edition }),
    `<section class="intro">`,
      vvrite(`artist and artwork revealed`),
      vvrite(`upon release of the final opepen set.`),
    `</section>`,
    `<section class="progress">`,
      `<header>`,
        vvrite(`progress`),
        vvrite(`inactive / burned`),
      `</header>`,
      `<div class="bar">`,
        `<div style="width: ${set/200*100}%"></div>`,
        `<div style="width: ${burned/80/200*100}%"></div>`,
      `</div>`,
      `<div style="left: ${set/200*100}%">${vvrite(`${pad(revealedSets)}`)}</div>`,
    `</section>`,
  ].join('')

  RENDERED = true
}

render()
