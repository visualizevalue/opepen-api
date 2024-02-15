import React from 'react'
import pad from 'App/Helpers/pad'
import Renderer from './Renderer'
import SetModel from 'App/Models/SetModel'

export default class SetOverviewRenderer extends Renderer {
  public static async render (set: SetModel) {
    await Promise.all([
      set.load('edition1Image'),
      set.load('edition4Image'),
      set.load('edition5Image'),
      set.load('edition10Image'),
      set.load('edition20Image'),
      set.load('edition40Image'),
    ])

    const imagePadding = 10
    const imageWidth = (this.ASPECT_RATIOS.WIDE.HEIGHT - imagePadding * 2 - this.PADDING*2) / 3

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
          padding: '4rem',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '50%',
        }}>
          <img width="32px" height="32px" src={await this.urlAsBuffer('https://opepen.nyc3.cdn.digitaloceanspaces.com/opepen-icon-white.png')} />

          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            margin: 'auto 0 0 0',
            justifyContent: 'flex-end',
          }}>
            <p style={{
              textTransform: 'uppercase',
              display: 'block',
              color: '#696969',
              margin: '0 0 0.5em',
              fontFamily: 'SpaceGrotesk-Bold',
            }}
            >Set {pad(set.id, 3)}</p>
            <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{set.name || 'Unrevealed'}</h1>
          </aside>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          width: '50%',
          position: 'relative',
          left: this.ASPECT_RATIOS.WIDE.WIDTH/2 - imageWidth*3 - imagePadding*2 - this.PADDING + 'px',
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
      </div>
    )

    return this.png(svg)
  }
}
