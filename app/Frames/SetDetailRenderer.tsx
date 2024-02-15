import React from 'react'
import pad from 'App/Helpers/pad'
import Renderer from './Renderer'
import SetModel from 'App/Models/SetModel'

export default class SetDetailRenderer extends Renderer {
  public static async render (set: SetModel) {
    await Promise.all([
      set.load('edition1Image'),
      set.load('edition4Image'),
      set.load('edition5Image'),
      set.load('edition10Image'),
      set.load('edition20Image'),
      set.load('edition40Image'),
    ])

    const paddingY = 32
    const paddingX = paddingY*3
    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.SQUARE.WIDTH - imagePadding * 2 - paddingX*2) / 3

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
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '100%',
          position: 'relative',
        }}>
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
            }}
            src={await this.urlAsBuffer(set.edition1Image?.staticURI)}
            width={imageWidth * 2 + imagePadding}
            height={imageWidth * 2 + imagePadding}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition4Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth + imagePadding + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition5Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition10Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth + imagePadding + 'px',
            }}
            src={await this.urlAsBuffer(set.edition20Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
          <img
            style={{
              border: '1px solid #363636',
              borderRadius: '4px 16px 16px 16px',
              position: 'absolute',
              top: imageWidth * 2 + imagePadding * 2 + 'px',
              left: imageWidth * 2 + imagePadding * 2 + 'px',
            }}
            src={await this.urlAsBuffer(set.edition40Image?.staticURI)}
            width={imageWidth}
            height={imageWidth}
          />
        </div>

        <aside style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${paddingY}px ${paddingX}px`,
          display: 'flex',
          flexDirection: 'column',
          margin: 'auto 0 0 0',
          justifyContent: 'flex-end',
          backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.69) 0%, rgba(0,0,0,0) 100%)',
        }}>
          <p style={{
            textTransform: 'uppercase',
            display: 'block',
            color: '#696969',
            margin: '0 0 0.25em',
            fontFamily: 'SpaceGrotesk-Bold',
          }}
          >Set {pad(set.id, 3)}</p>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{set.name || 'Unrevealed'}</h1>
        </aside>
      </div>,
      'SQUARE'
    )

    return this.png(svg)
  }
}
