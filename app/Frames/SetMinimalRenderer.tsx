import React from 'react'
import Renderer from './Renderer'
import SetSubmission from 'App/Models/SetSubmission'

export default class SetMinimalRenderer extends Renderer {
  public static async render(submission: SetSubmission) {
    await Promise.all([
      submission.load('edition1Image'),
      submission.load('edition4Image'),
      submission.load('edition5Image'),
      submission.load('edition10Image'),
      submission.load('edition20Image'),
      submission.load('edition40Image'),
    ])

    const padding = 32
    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.SQUARE.WIDTH - imagePadding * 2 - padding * 2) / 3

    const svg = await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '#101010',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          padding: `${padding}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: '100%',
            position: 'relative',
          }}
        >
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
            }}
            src={await this.urlAsBuffer(submission.edition1Image?.renderURI)}
            width={imageWidth * 2 + imagePadding}
            height={imageWidth * 2 + imagePadding}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(submission.edition4Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
              top: imageWidth + imagePadding + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(submission.edition5Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(submission.edition10Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth + imagePadding + 'px',
            }}
            src={await this.urlAsBuffer(submission.edition20Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '12px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(submission.edition40Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
        </div>
      </div>,
      'SQUARE',
    )

    return this.png(svg)
  }
}
