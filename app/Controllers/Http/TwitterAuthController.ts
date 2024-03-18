import { TwitterApi } from 'twitter-api-v2'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'
import { Account } from 'App/Models'
import { DateTime } from 'luxon'

export default class TwitterAuthController {

  callbackURI: string = Env.get('APP_URL') + '/oauth/twitter'

  private get client () {
    return new TwitterApi({ clientId: Env.get('TWITTER_CLIENT_ID'), clientSecret: Env.get('TWITTER_CLIENT_SECRET') })
  }

  public async getUrl ({ session }: HttpContextContract) {
    const { url, codeVerifier, state } = this.client.generateOAuth2AuthLink(this.callbackURI, {
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
    })

    session.put('codeVerifier', codeVerifier)
    session.put('state', state)

    return {
      url,
    }
  }

  public async callback ({ request, session, response }: HttpContextContract) {
    const { state, code } = request.qs()
    const codeVerifier = session.get('codeVerifier')
    const sessionState = session.get('state')

    if (!codeVerifier || !state || !sessionState || !code) {
      return response.status(400).send('You denied the app or your session expired!')
    }

    if (state !== sessionState) {
      return response.status(400).send('Stored tokens didnt match!')
    }

    try {
      const {
        client: userClient,
        accessToken,
        refreshToken,
        expiresIn,
      } = await this.client.loginWithOAuth2({ code, codeVerifier, redirectUri: this.callbackURI })

      const account = await Account.query()
        .where('address', session.get('siwe')?.address?.toLowerCase())
        .firstOrFail()

      account.oauth.accessToken = accessToken
      account.oauth.refreshToken = refreshToken
      account.oauth.expiresAt = DateTime.now().plus({ seconds: expiresIn - 30 }).toISO()
      account.oauth.twitterUser = (await userClient.v2.me()).data

      await account.save()

      return {
        expiresAt: account.oauth.expiresAt,
      }
    } catch (e) {
      console.log(e)
      return response.status(403).send('Invalid verifier or access tokens!')
    }
  }

}
