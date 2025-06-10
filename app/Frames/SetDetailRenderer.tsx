import React from 'react'
import pad from 'App/Helpers/pad'
import Renderer from './Renderer'
import SetSubmission from 'App/Models/SetSubmission'

export default class SetDetailRenderer extends Renderer {
  public static async render(submission: SetSubmission) {
    await Promise.all([
      submission.load('edition1Image'),
      submission.load('edition4Image'),
      submission.load('edition5Image'),
      submission.load('edition10Image'),
      submission.load('edition20Image'),
      submission.load('edition40Image'),
    ])

    const paddingY = 32
    const paddingX = paddingY * 3
    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.SQUARE.WIDTH - imagePadding * 2 - paddingX * 2) / 3

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
          padding: `${paddingY}px ${paddingX}px`,
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              objectFit: 'contain',
              objectPosition: 'center',
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
              objectFit: 'contain',
              objectPosition: 'center',
            }}
            src={await this.urlAsBuffer(submission.edition40Image?.renderURI)}
            width={imageWidth}
            height={imageWidth}
          />
        </div>

        <aside
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: `${paddingY}px ${paddingX}px`,
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto 0 0 0',
            justifyContent: 'flex-end',
            backgroundImage:
              'linear-gradient(to top, rgba(0,0,0,0.69) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          <p
            style={{
              textTransform: 'uppercase',
              display: 'block',
              color: '#696969',
              margin: '0 0 0.25em',
              fontFamily: 'SpaceGrotesk-Bold',
            }}
          >
            {submission.setId ? `Set ${pad(submission.setId, 3)}` : `Set Submission`}
          </p>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1' }}>
            {submission.name || 'Unrevealed'}
          </h1>
        </aside>
      </div>,
      'SQUARE',
    )

    return this.png(svg)
  }
}
