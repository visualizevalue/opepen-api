import React from 'react'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import Drive from '@ioc:Adonis/Core/Drive'
import EventModel from 'App/Models/Event'

export class DailyOpepen {

  public async forDay (date: DateTime) {
    const key = `daily-summaries/${date.toISODate()}`

    if (await Drive.exists(key)) {
      return await Drive.get(key)
    }

    const image = await this.makePNG(date)

    await Drive.put(key, image)

    return image
  }

  private async makePNG (date: DateTime) {
    const events = await EventModel.query()
      .preload('opepen', query => query.preload('image'))
      .where('timestamp', '>=', date.minus({ day: 1 }).toISO())
      .where('timestamp', '<=', date.toISO())
      .distinct('tokenId')
      .limit(81)

    const count = events.length
    const perSide = Math.floor(Math.sqrt(count))
    const dimension = Math.floor(1920 / perSide)

    const svg = await this.svg(
      <div
        style={{
          height: '1920px',
          width: '1920px',
          backgroundColor: '#000',
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {
          await Promise.all(
            events.slice(0, perSide**2).map(async e =>
              <img
                src={
                  await this.urlAsBuffer(e.opepen.image
                    ? e.opepen.image.staticURI
                    : `https://api.opepen.art/${e.tokenId}/image`)
                }
                width={dimension}
                height={dimension}
              />
            )
          )
        }
      </div>
    )

    return await this.png(svg)
  }

  protected async svg (svg) {
    return satori(
      svg,
      {
        width: 1920,
        height: 1920,
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

export default new DailyOpepen()
