import React from 'react'
import Env from '@ioc:Adonis/Core/Env'
import pad from 'App/Helpers/pad'
import Renderer from './Renderer'

export default class SetOptInRenderer extends Renderer {
  public static async render({ count, set, edition }) {
    const imageUrl = edition
      ? `${Env.get('APP_URL')}/v1/frames/sets/${set.id}/detail/${edition}/image`
      : `${Env.get('APP_URL')}/v1/frames/sets/${set.id}/detail/image`

    const padding = 32 * 3

    return await this.png(
      await this.svg(
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: '#101010',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 24,
          }}
        >
          <img src={await this.urlAsBuffer(imageUrl)} />
          <aside
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              padding: `${padding}px ${padding}px`,
              display: 'flex',
              flexDirection: 'column',
              margin: 'auto 0 0 0',
              justifyContent: 'center',
              textAlign: 'center',
              alignItems: 'center',
              backgroundImage:
                'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.69) 60%, rgba(0,0,0,0.5) 100%)',
            }}
          >
            <h1 style={{ fontWeight: 500, margin: '0', lineHeight: '1.1' }}>
              {count ? 'Success!' : 'No Opepen found.'}
            </h1>
            <p>
              You opted in {count} Opepen to set {pad(set.id, 3)} ({set.name})
              {edition && ` Edition of ${edition}`}.
            </p>
            {!count && (
              <p style={{ margin: '0' }}>
                Make sure you have your Ethereum address connected to your Farcaster account.
              </p>
            )}
          </aside>
        </div>,
        'SQUARE',
      ),
    )
  }
}
