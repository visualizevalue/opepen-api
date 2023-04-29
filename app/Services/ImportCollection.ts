import { paths } from '@reservoir0x/reservoir-kit-client'
import Env from '@ioc:Adonis/Core/Env'
import apiGenerator from 'api'
import { delay } from 'App/Helpers/time'
import Logger from '@ioc:Adonis/Core/Logger'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'
import Account from 'App/Models/Account'

// @ts-ignore
type Token = paths['/tokens/v5']['get']['responses']['200']['schema']['tokens'][0]

const sdk = apiGenerator('@reservoirprotocol/v1.0#1llv231dlb6nmm72')
sdk.server(Env.get('RESERVOIR_BASE'))

export default class ImportCollection {
  public async run(contract: string, ModelClass: LucidModel) {
    sdk.auth(Env.get('RESERVOIR_KEY'))

    Logger.info(`Fetching and importing collection for ${contract}`)

    // Fetch Tokens
    let tokens: Token[] = []
    try {
      let data = await this.fetchBatch(contract)
      tokens = tokens.concat(data.tokens)
      while (data.continuation) {
        Logger.info(`Fetching next page (${tokens.length} tokens so far)`)

        await delay(500)
        data = await this.fetchBatch(contract, data.continuation)
        tokens = tokens.concat(data.tokens)
      }
    } catch (e) {
      console.log(e)
    }

    // Save Tokens
    for (const { token } of tokens) {
      const owner = await Account.updateOrCreate({ address: token.owner?.toLowerCase() }, {})
      await ModelClass.updateOrCreate({
        tokenId: token.tokenId,
      }, {
        owner: owner.address,
      })
      Logger.info(`Saved token ${token.tokenId}`)
    }
  }

  private async fetchBatch (contract: string, continuation?: string) {
    const query: {
      contract: string,
      limit: string,
      accept: string,
      continuation?: string,
      startTimestamp?: number,
    } = {
      contract,
      limit: '100',
      accept: '*/*',
    }

    if (continuation) {
      query.continuation = continuation
    }

    const { data } = await sdk.getTokensV5(query)

    return data as paths['/tokens/v5']['get']['responses']['200']['schema']
  }
}
