import React from 'react'
import Renderer from './Renderer'
import Image from 'App/Models/Image'

export default class OpePollRenderer extends Renderer {
  public static async render ({ leftImage, rightImage }: { leftImage: Image, rightImage: Image }) {
    return this.png(await this.svg(<div
      style={{
        height: '100%',
        width: '100%',
        backgroundColor: '#101010',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        fontSize: 24,
        padding: '2rem 2.5rem',
      }}
    >
      <img
        style={{
          border: '1px solid #363636',
          borderRadius: '12px',
        }}
        src={await this.urlAsBuffer(leftImage.staticURI)}
        width="350"
        height="350"
      />

      <img
        style={{
          border: '1px solid #363636',
          borderRadius: '12px',
        }}
        src={await this.urlAsBuffer(rightImage.staticURI)}
        width="350"
        height="350"
      />
    </div>))
  }
}
