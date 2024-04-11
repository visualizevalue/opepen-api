import React from 'react'
import Drive from '@ioc:Adonis/Core/Drive'
import Renderer from './Renderer'
import Opepen from 'App/Models/Opepen'
import pad from 'App/Helpers/pad'
import { formatDate } from 'App/Helpers/dates'

export default class OpepenRenderer extends Renderer {

  public static async render (opepen: Opepen, force: boolean = false) {
    const submission = opepen.submission
    const lastEvent = opepen.events[0]

    const key = `opepen/${opepen.tokenId}_${submission?.uuid}_${lastEvent.blockNumber}.png`

    if (!force && await Drive.exists(key)) {
      return await Drive.get(key)
    }

    const png = await this.png(await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: 'black',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          fontSize: 26,
          fontFamily: 'SpaceGrotesk-Bold',
          textTransform: 'uppercase',
          padding: '0',
        }}
      >
        <img src={`https://api.opepen.art/${opepen.tokenId}/render`} alt="Opepen Image" width="1000" height="1000" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            width: '910px',
            height: '1000px',
            padding: '125px',
            gap: '0',
          }}
        >
          { opepen.setId && (
            <img
              style={{
                position: 'absolute',
                top: 125,
                right: 125,
              }}
              src={`https://opepen.nyc3.cdn.digitaloceanspaces.com/status-${opepen.data.edition}.png`}
              alt="Status Image"
              width="135"
              height="135"
            />
          )}

          <img style={{ display: 'block', margin: '0' }} src="https://opepen.nyc3.cdn.digitaloceanspaces.com/check-white.png" width="24" height="24" />
          <p style={{ margin: '26px 0 0', lineHeight: '1' }}>1 of {opepen.data.edition}</p>
          <p style={{ opacity: '0.5', margin: '20px 0', lineHeight: '1' }}>Opepen {opepen.tokenId.toString()}</p>

          <h1
            style={{
              margin: '40px 0 100px',
              fontSize: '64px',
            }}
          >{opepen.setId ? submission[`edition_${opepen.data.edition}Name`] : `Unrevealed`}</h1>

          {
            opepen.setId && (
              <div style={{display: 'flex', flexDirection: 'column', margin: '0'}}>
                <p style={{margin: '0 0 12px'}}>Set “{submission.name}”</p>
                <p style={{margin: '12px 0'}}>Release {pad(submission.setId, 3)}</p>
                <p style={{margin: '12px 0'}}>By {await submission.creatorNames()}</p>
                <p style={{margin: '12px 0'}}>{submission.editionType} Editions</p>
                <p style={{margin: '12px 0 0'}}>Consensus on {submission.revealsAt && formatDate(submission.revealsAt)} Editions</p>
              </div>
            )
          }

          <div style={{display: 'flex', flexDirection: 'column', margin: 'auto 0 -15px', width: '660px'}}>
            <p style={{margin: '0 0 5px', opacity: '0.5'}}>Owned By</p>
            <p style={{margin: '5px 0'}}>
              <span>{opepen.ownerAccount.display}</span>
              <span style={{opacity: '0.5', marginLeft: 'auto'}}>Block {lastEvent.blockNumber}</span>
            </p>
          </div>
        </div>
      </div>,
      'WIDE',
      2
    ))

    this.saveImage(key, png)

    return png
  }

}
