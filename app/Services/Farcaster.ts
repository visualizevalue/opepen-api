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

  public async getUser (fid: number) {
    const url = `${this.base}/v1/verificationsByFid?fid=${fid}`
    const user: {
      fid: number,
      addresses: string[]
    } = {
      fid,
      addresses: [],
    }

    try {
      const response = await axios.get(url)

      // TODO: Implement pagination
      for (const message of response.data.messages) {
        if (message.data.type !== 'MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS') return

        user.addresses.push(message.data.verificationAddEthAddressBody.address?.toLowerCase())
      }

      // TODO: Fetch signer account address(es)
    } catch (e) {
      console.error(e)
    }

    return user
  }
}

export default new Farcaster()
