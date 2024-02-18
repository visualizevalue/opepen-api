import React from 'react'
import Account from 'App/Models/Account'
import Renderer from './Renderer'

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
          src={await this.urlAsBuffer(account.pfp?.staticURI || 'https://opepenai.nyc3.digitaloceanspaces.com/images/764c9320-05a9-4329-87a5-117277d21df9@sm.png')}
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

}
