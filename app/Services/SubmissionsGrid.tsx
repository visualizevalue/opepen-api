import React from 'react'
import axios from 'axios'
import satori from 'satori'
import sharp from 'sharp'
import SetSubmission from 'App/Models/SetSubmission'
import Env from '@ioc:Adonis/Core/Env'

export class SubmissionsGrid {
  public async make(ids: string[]) {
    const submissions = await SetSubmission.query()
      .preload('edition1Image')
      .preload('edition4Image')
      .preload('edition5Image')
      .preload('edition10Image')
      .preload('edition20Image')
      .preload('edition40Image')
      .whereIn('uuid', ids)
      .orderBy('updatedAt', 'desc')
      .limit(81)

    const count = submissions.length
    const perSide = Math.ceil(Math.sqrt(count))
    const width = 1920
    const height = width
    const padding = 20
    const dimension = Math.floor((width - padding * 2) / perSide)

    const svg = await this.svg(
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: '#101010',
          padding: `${padding}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {await Promise.all(
            submissions.slice(0, perSide ** 2).map(async (submission) => {
              return (
                <img
                  key={submission.uuid}
                  src={await this.urlAsBuffer(
                    `${Env.get('APP_URL')}/v1/render/sets/${submission.uuid}/minimal`,
                  )}
                  width={dimension}
                  height={dimension}
                />
              )
            }),
          )}
        </div>
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

export default new SubmissionsGrid()
