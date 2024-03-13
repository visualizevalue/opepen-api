import React from 'react'
import Account from 'App/Models/Account'
import Renderer from './Renderer'
import Opepen from 'App/Models/Opepen'

const DEFAULT_PFP: string = 'https://opepenai.nyc3.digitaloceanspaces.com/images/764c9320-05a9-4329-87a5-117277d21df9@sm.png'

export default class AccountRenderer extends Renderer {

  public static async render (account: Account) {
    return this.png(await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '101010',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: 24,
          padding: '3rem',
          gap: '2rem',
        }}
      >
        <img
          width="96px"
          height="96px"
          src={await this.urlAsBuffer(account.pfp?.staticURI || DEFAULT_PFP)}
          style={{
            borderRadius: '8px 48px 48px 48px',
            border: '2px solid #363636',
          }}
        />
        <h1
          style={{
            margin: '0',
          }}
        >{account.display}</h1>
        {
          account.tagline && (
            <p
              style={{
                margin: '0',
              }}
            >{account.tagline}</p>
          )
        }
      </div>
    ))
  }

  public static async renderWithOwnedOpepen (account: Account) {
    const opepen = await Opepen.query().where('owner', account.address)

    const perSide = Math.min(4, Math.floor(Math.sqrt(opepen.length)))
    const opepenOnDisplay = opepen
        .sort((a, b) => a.data.edition > b.data.edition ? 1 : -1)
        .sort((a, b) => a.setId === null
          ? 1
          : b.setId === null
            ? -1
            : a.setId > b.setId
              ? 1
              : -1
        )
        .slice(0, perSide**2)

    const gap: number = 8
    const width: number = 415
    const imageWidth: number = Math.floor((width - perSide*gap) / perSide)

    return this.png(await this.svg(
      <div
        style={{
          height: '100%',
          width: '100%',
          backgroundColor: '101010',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 24,
          padding: '3rem',
          gap: '1rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem',
          }}
        >
          <img
            width="96px"
            height="96px"
            src={await this.urlAsBuffer(account.pfp?.staticURI || DEFAULT_PFP)}
            style={{
              borderRadius: '8px 48px 48px 48px',
              border: '2px solid #363636',
            }}
          />
          <h1
            style={{
              margin: '0',
            }}
          >{account.display}</h1>
          {
            account.tagline && (
              <p
                style={{
                  margin: '0',
                }}
              >{account.tagline}</p>
            )
          }
        </div>

        <div
          style={{
            height: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: `${width}px`,
            gap: `${gap}px`,
          }}
        >
          {
            await Promise.all(
              opepenOnDisplay.map(async opepen => (
                <img
                  key={opepen.tokenId.toString()}
                  src={await this.urlAsBuffer(opepen.image?.staticURI)}
                  style={{
                    width: `${imageWidth}px`,
                    borderRadius: '2px 8px 8px 8px',
                    border: '1px solid #363636',
                  }}
                />
              ))
            )
          }
        </div>
      </div>
    ))
  }

}
