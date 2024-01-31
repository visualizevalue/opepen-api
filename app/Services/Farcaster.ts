import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'

export class Farcaster {
  private base: string = Env.get('FC_HUB_BASE')
  private postConfig = {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  }

  public async verifyMessage ({ untrustedData, trustedData }: { untrustedData: any, trustedData: any }): Promise<boolean> {
    const url = `${this.base}/v1/validateMessage`

    try {
      const response = await axios.post(url, Buffer.from(trustedData.messageBytes, 'hex'), this.postConfig)

      if (! response.data.valid) return false

      const signedURL = Buffer.from(response.data.message?.data.frameActionBody.url, 'base64').toString('utf8')
      if (signedURL !== untrustedData.url) return false
    } catch (e) {
      return false
    }

    return true
  }
}

export default new Farcaster()
