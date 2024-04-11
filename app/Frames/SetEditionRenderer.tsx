import React from 'react'
import pad from 'App/Helpers/pad'
import Renderer from './Renderer'
import SetSubmission from 'App/Models/SetSubmission'

export default class SetEditionRenderer extends Renderer {
  public static async render ({
      submission,
      edition,
    }: {
      submission: SetSubmission,
      edition: 1|4|5|10|20|40,
    }) {
    await submission.load(`edition${edition}Image`)
    const image = submission[`edition${edition}Image`]

    const paddingY = 32
    const paddingX = paddingY*3
    const imageWidth = this.ASPECT_RATIOS.SQUARE.WIDTH - paddingX*2

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
        <img
          style={{
            border: '1px solid #363636',
            borderRadius: '4px 16px 16px 16px',
            width: '100%',
          }}
          src={await this.urlAsBuffer(image?.staticURI)}
          width={imageWidth}
          height={imageWidth}
        />

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
          >{ submission.setId ? `Set ${pad(submission.setId, 3)}` : `Set Submission` } - Edition of { edition }</p>
          <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1', }}>{submission[`edition_${edition}Name`] || 'Unnamed'}</h1>
        </aside>
      </div>,
      'SQUARE'
    )

    return await this.png(svg)
  }
}
