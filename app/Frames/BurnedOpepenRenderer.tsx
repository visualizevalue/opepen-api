import React from 'react'
import Drive from '@ioc:Adonis/Core/Drive'
import Env from '@ioc:Adonis/Core/Env'
import Renderer from './Renderer'
import BurnedOpepen from 'App/Models/BurnedOpepen'
import { formatDate } from 'App/Helpers/dates'

export default class BurnedOpepenRenderer extends Renderer {
  public static async render(opepen: BurnedOpepen, force: boolean = false) {
    const url = opepen.data.image
    const lastEvent = opepen.events[0]

    const key = `burned-opepen/${opepen.tokenId}_${lastEvent.blockNumber}_v2.png`

    if (!force && (await Drive.exists(key))) {
      return await Drive.get(key)
    }

    const png = await this.png(
      await this.svg(
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
          <img
            src={`https://ipfs.vv.xyz/ipfs/${url.replace('ipfs://', '')}`}
            alt="Burned Opepen Image"
            width="1000"
            height="1000"
          />
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
            >
              <p style={{ margin: '0', opacity: '0.5' }}>Consensus Met</p>
              <h1
                style={{
                  fontSize: '64px',
                  margin: '0',
                }}
              >
                {opepen.name}
              </h1>
            </div>

            {/* somehow didn't work with only justifyContent: space-between */}
            <div style={{ flex: 1 }}></div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '50px',
                alignItems: 'flex-end',
              }}
            >
              <img
                src={`${Env.get('APP_URL')}/${opepen.opepen.tokenId}/render`}
                alt="Opepen Image"
                width="400"
                height="400"
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <p style={{ margin: '0 0 5px' }}>Opepen {opepen.opepen.tokenId.toString()}</p>
                <p style={{ margin: '0' }}>burned on {formatDate(opepen.burnedAt)}</p>
              </div>
            </div>

            <div style={{ flex: 1 }}></div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto 0 -15px',
                width: '660px',
              }}
            >
              <p style={{ margin: '0 0 5px', opacity: '0.5' }}>Owned By</p>
              <p style={{ margin: '5px 0' }}>
                <span>{opepen.ownerAccount.display}</span>
                <span style={{ opacity: '0.5', marginLeft: 'auto' }}>
                  Block {lastEvent.blockNumber}
                </span>
              </p>
            </div>
          </div>
        </div>,
        'WIDE',
        2,
      ),
    )

    this.saveImage(key, png)

    return png
  }
}
