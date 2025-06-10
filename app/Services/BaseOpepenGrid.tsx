import React from 'react'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import { GridItem } from 'App/Services/GridItem'

export class BaseOpepenGrid {
  public async make(
    items: GridItem[],
    forceSquare: boolean = true,
    highlighted: string[] = [],
  ) {
    const count = items.length
    const width = 1920
    let perSide = forceSquare ? Math.floor(Math.sqrt(count)) : Math.ceil(Math.sqrt(count))
    let dimension = Math.floor(width / perSide)

    const highlightedItems = items
      .filter((item) => item.type === 'opepen' && highlighted.includes(item.tokenId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt.toString()).getTime() -
          new Date(a.updatedAt.toString()).getTime(),
      )
    const regularItems = items
      .filter((item) => !(item.type === 'opepen' && highlighted.includes(item.tokenId)))
      .sort(
        (a, b) =>
          new Date(b.updatedAt.toString()).getTime() -
          new Date(a.updatedAt.toString()).getTime(),
      )

    const sortedItems = [...highlightedItems, ...regularItems]

    let positions: { x: number; y: number; size: number; item: GridItem }[] = []

    while (true) {
      const grid = Array.from({ length: perSide }, () => Array(perSide).fill(false))
      let failed = false
      positions = []

      function findSpace(size: number) {
        for (let row = 0; row <= perSide - size; row++) {
          for (let col = 0; col <= perSide - size; col++) {
            let fits = true
            for (let dy = 0; dy < size; dy++) {
              for (let dx = 0; dx < size; dx++) {
                if (grid[row + dy][col + dx]) {
                  fits = false
                  break
                }
              }
              if (!fits) break
            }
            if (fits) {
              for (let dy = 0; dy < size; dy++) {
                for (let dx = 0; dx < size; dx++) {
                  grid[row + dy][col + dx] = true
                }
              }
              return { row, col }
            }
          }
        }
        return null
      }

      for (const item of sortedItems) {
        const isHighlighted = item.type === 'opepen' && highlighted.includes(item.tokenId)
        const size = isHighlighted ? 2 : 1
        const spot = findSpace(size)
        if (!spot) {
          failed = true
          break
        } else {
          positions.push({
            x: spot.col * dimension,
            y: spot.row * dimension,
            size,
            item,
          })
        }
      }

      if (!failed) break

      perSide += 1
      dimension = Math.floor(width / perSide)
    }
    const height = forceSquare
      ? dimension * perSide
      : Math.max(...positions.map((pos) => pos.y + dimension * pos.size))
    const svg = await this.svg(
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#000',
          display: 'flex',
        }}
      >
        {await Promise.all(
          positions.map(async ({ x, y, size, item }) => {
            const imageUrl =
              item.image?.staticURI || `https://api.opepen.art/${item.tokenId}/image`

            return (
              <img
                key={item.tokenId}
                src={await this.urlAsBuffer(imageUrl)}
                style={{
                  position: 'absolute',
                  top: `${y}px`,
                  left: `${x}px`,
                  width: `${dimension * size}px`,
                  height: `${dimension * size}px`,
                  objectFit: 'contain',
                }}
              />
            )
          }),
        )}
      </div>,
      {
        width,
        height,
      },
    )

    return await this.png(svg)
  }

  protected async svg(svg, { width, height }) {
    return satori(svg, {
      width,
      height,
      fonts: [],
    })
  }

  protected async png(svg) {
    return await sharp(Buffer.from(svg)).toFormat('png').toBuffer()
  }

  protected async urlAsBuffer(
    url: string = 'https://opepenai.nyc3.cdn.digitaloceanspaces.com/images/base.png',
  ) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })

      let contentType = response.headers['content-type']
      let buffer = Buffer.from(response.data, 'utf-8')

      if (!['image/png', 'image/jpeg'].includes(contentType)) {
        buffer = await sharp(buffer).toFormat('png').toBuffer()
        contentType = 'image/png'
      }

      return `data:${contentType};base64,${buffer.toString('base64')}`
    } catch (e) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }
  }
}

export default new BaseOpepenGrid()
