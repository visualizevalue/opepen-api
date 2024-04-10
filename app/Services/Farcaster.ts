import axios from 'axios'
import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'

export class Farcaster {
  HUB_HTTP_URL: string = `https://${Env.get('FARCASTER_HUB')}:2281`
  HUB_GRPC_URL: string = `${Env.get('FARCASTER_HUB')}:2283`
  NETWORK: number = 1
  SIGNER: string = Env.get('FARCASTER_SIGNER')
  FID: number = 319906
  DATA_OPTIONS = {
    fid: this.FID,
    network: this.NETWORK,
  }

  ed25519Signer
  client
  makeCastAdd
  bytesToHex

  initiated: boolean = false

  constructor () {
    this.init()
  }

  private async init () {
    if (this.initiated) return

    const [
      {
        NobleEd25519Signer,
        getInsecureHubRpcClient,
        makeCastAdd,
      },
      {
        bytesToHex,
        hexToBytes,
      }
    ] = await Promise.all([
      // FIXME: Proper ESM imports
      await eval(`import('@farcaster/hub-nodejs')`),
      await eval(`import('@noble/hashes/utils')`),
    ])

    this.ed25519Signer = new NobleEd25519Signer(hexToBytes(this.SIGNER.slice(2)))
    this.client = getInsecureHubRpcClient(this.HUB_GRPC_URL)

    this.makeCastAdd = makeCastAdd
    this.bytesToHex = bytesToHex

    this.initiated = true
  }

  public async cast (text: string, imageUrl?: string|string[], parentUrl: string = `chain://eip155:1/erc721:0x6339e5e072086621540d0362c4e3cea0d643e114`) {
    await this.init()
    if (! Application.inProduction) return Logger.debug(`Not sending casts in development`)

    try {
      const cast = await this.submitMessage(
        this.makeCastAdd(
          {
            text,
            embeds: imageUrl ? Array.isArray(imageUrl) ? imageUrl.map(url => ({ url })) : [{ url: imageUrl }] : [],
            embedsDeprecated: [],
            mentions: [],
            mentionsPositions: [],
            parentUrl,
          },
          this.DATA_OPTIONS,
          this.ed25519Signer,
        )
      )

      Logger.info(`New cast: ${this.bytesToHex(cast.value.hash)}`)
    } catch (e) {
      Logger.warn(`Error Casting: ${e?.message || JSON.stringify(e)}`)
    }
  }

  private async submitMessage (resultPromise) {
    const result = await resultPromise
    if (result.isErr()) {
      throw new Error(`Error creating message: ${result.error}`)
    }

    const messageSubmitResult = await this.client.submitMessage(result.value)
    if (messageSubmitResult.isErr()) {
      throw new Error(`Error submitting message to hub: ${messageSubmitResult.error}`)
    }

    return messageSubmitResult
  }

  public async verifyMessage ({ untrustedData, trustedData }: { untrustedData: any, trustedData: any }): Promise<boolean> {
    const url = `${this.HUB_HTTP_URL}/v1/validateMessage`

    try {
      const response = await axios.post(url, Buffer.from(trustedData.messageBytes, 'hex'), {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      })

      if (! response.data.valid) return false

      const signedURL = Buffer.from(response.data.message?.data.frameActionBody.url, 'base64').toString('utf8')
      if (signedURL !== untrustedData.url) return false
    } catch (e) {
      return false
    }

    return true
  }

  public async getUser (fid: number) {
    const url = `${this.HUB_HTTP_URL}/v1/verificationsByFid?fid=${fid}`
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
