import React from 'react'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import Opepen from 'App/Models/Opepen'

export class OpepenGrid {

  public async make (ids: string[], forceSquare: boolean = true, highlighted: string[] = []) {
    const opepen = await Opepen.query()
      .preload('image')
      .whereIn('tokenId', Array.from(new Set(ids.concat(highlighted))))
      .orderBy('updatedAt', 'desc')
      .limit(81)

    const count = opepen.length
    const perSide = forceSquare
      ? Math.floor(Math.sqrt(count))
      : Math.ceil(Math.sqrt(count))
    const width = 1920
    const dimension = Math.floor(width / perSide)
    const height = dimension * Math.ceil(count / perSide)

    const svg = await this.svg(
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#000',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {
          await Promise.all(
            opepen.slice(0, perSide**2).map(async o => {
              const isHighlighted = highlighted.includes(o.tokenId.toString())

              return <img
                src={
                  await this.urlAsBuffer(o.image
                    ? o.image.staticURI
                    : `https://api.opepen.art/${o.tokenId}/image`)
                }
                style={{
                  border: isHighlighted ? '3px solid grey' : 'none',
                }}
                width={dimension}
                height={dimension}
              />
            })
          )
        }
      </div>,
      {
        width,
        height,
      }
    )

    return await this.png(svg)
  }

  protected async svg (svg, { width, height }) {
    return satori(
      svg,
      {
        width,
        height,
        fonts: [],
      }
    )
  }

  protected async png (svg) {
    return await sharp(Buffer.from(svg))
      .toFormat('png')
      .toBuffer()
  }

  protected async urlAsBuffer (url: string = 'https://opepenai.nyc3.cdn.digitaloceanspaces.com/images/base.png') {
    try {
      const response = await axios.get(url,  { responseType: 'arraybuffer' })

      let contentType = response.headers['content-type']
      let buffer = Buffer.from(response.data, 'utf-8')

      if (! ['image/png', 'image/jpeg'].includes(contentType)) {
        buffer = await sharp(buffer).toFormat('png').toBuffer()
        contentType = 'image/png'
      }

      return `data:${contentType};base64,${buffer.toString('base64')}`
    } catch (e) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  }

}

export default new OpepenGrid()
