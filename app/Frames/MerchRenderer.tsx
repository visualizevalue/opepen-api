import React from 'react'
import Renderer from './Renderer'

const USDollar = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export default class MerchRenderer extends Renderer {
  public static async render(product) {
    return this.png(
      await this.svg(
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: 'white',
            color: 'black',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 24,
            padding: '3rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '50%',
            }}
          >
            <img
              width="32px"
              height="32px"
              src={await this.urlAsBuffer(
                'https://opepen.nyc3.cdn.digitaloceanspaces.com/opepen-icon-black.png',
              )}
            />

            <aside
              style={{
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto 0 0 0',
                justifyContent: 'flex-end',
              }}
            >
              <h1
                style={{ fontWeight: 500, fontSize: '3rem', margin: '0', lineHeight: '1.1' }}
              >
                {product.name}
              </h1>
              <p
                style={{
                  textTransform: 'uppercase',
                  display: 'block',
                  color: '#696969',
                  margin: '0.5em 0 0',
                  fontFamily: 'SpaceGrotesk-Bold',
                }}
              >
                {this.usd(product.price)}
              </p>
            </aside>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              width: '50%',
              position: 'relative',
            }}
          >
            <img
              style={{
                position: 'absolute',
              }}
              src={await this.urlAsBuffer(product.image)}
            />
          </div>
        </div>,
      ),
    )
  }

  public static async renderConfirmation(products) {
    return this.png(
      await this.svg(
        <div
          style={{
            height: '100%',
            width: '100%',
            backgroundColor: 'white',
            color: 'black',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 24,
            padding: '3rem',
          }}
        >
          <img
            style={{
              position: 'absolute',
              top: '3rem',
              left: '3rem',
            }}
            width="32px"
            height="32px"
            src={await this.urlAsBuffer(
              'https://opepen.nyc3.cdn.digitaloceanspaces.com/opepen-icon-black.png',
            )}
          />
          <h1
            style={{
              position: 'absolute',
              top: '3rem',
              fontWeight: 500,
              fontSize: '2rem',
              margin: '0',
              lineHeight: '1',
              textAlign: 'center',
              textTransform: 'uppercase',
              color: '#696969',
            }}
          >
            Your cart
          </h1>

          <p></p>

          {await Promise.all(
            products.map(async (product) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <img width="96px" height="96px" src={await this.urlAsBuffer(product.image)} />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '70%',
                    marginLeft: '2rem',
                  }}
                >
                  <h1
                    style={{
                      fontWeight: 500,
                      fontSize: '2rem',
                      margin: '0 0.5rem',
                      lineHeight: '1',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {product.name}
                  </h1>
                  <div
                    style={{
                      color: '#696969',
                      marginLeft: '1rem',
                      fontSize: '1.25rem',
                    }}
                  >
                    (1x)
                  </div>
                  <p
                    style={{
                      textTransform: 'uppercase',
                      display: 'block',
                      color: '#696969',
                      marginLeft: 'auto',
                      fontSize: '1.5rem',
                    }}
                  >
                    {this.usd(product.price)}
                  </p>
                </div>
              </div>
            )),
          )}
        </div>,
      ),
    )
  }

  private static usd(price) {
    return USDollar.format(price)
  }
}
