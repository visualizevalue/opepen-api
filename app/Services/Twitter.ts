import axios from 'axios'
import { TwitterApi } from 'twitter-api-v2'
import Application from '@ioc:Adonis/Core/Application'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import Account from 'App/Models/Account'

export default class Twitter {
  private appClient: TwitterApi
  private userClient: TwitterApi
  private account: Account

  constructor (config: {
    appClient: TwitterApi,
    userClient: TwitterApi,
    account: Account
  }) {
    this.appClient = config.appClient
    this.userClient = config.userClient
    this.account = config.account
  }

  static async initialize (account: Account) {
    if (! account.oauth.accessToken || ! account.oauth.refreshToken) return

    const appClient = new TwitterApi({
      appKey: Env.get('TWITTER_API_KEY'),
      appSecret: Env.get('TWITTER_API_SECRET'),
      accessToken: Env.get('TWITTER_ACCESS_TOKEN'),
      accessSecret: Env.get('TWITTER_ACCESS_TOKEN_SECRET'),
    })

    let userAccessToken: string = account.oauth.accessToken

    const isExpired = DateTime.fromISO(account.oauth.expiresAt as string).diff(DateTime.now()).as('minutes') < 5
    if (isExpired) {
      const oauthClient = new TwitterApi({
        clientId: Env.get('TWITTER_CLIENT_ID'),
        clientSecret: Env.get('TWITTER_CLIENT_SECRET'),
      })

      const {
        accessToken,
        refreshToken,
        expiresIn,
      } = await oauthClient.refreshOAuth2Token(account.oauth.refreshToken)

      userAccessToken = accessToken

      account.oauth.accessToken = accessToken
      account.oauth.refreshToken = refreshToken
      account.oauth.expiresAt = DateTime.now().plus({ seconds: expiresIn - 30 }).toISO()

      await account.save()
    }

    const userClient = new TwitterApi(userAccessToken)

    return new Twitter({ appClient, userClient, account })
  }

  public async tweet (text: string, imageUrl?: string) {
    if (! Application.inProduction) return Logger.debug(`Not sending tweets in development`)

    try {
      const media = await this.uploadMedia(imageUrl)

      const { data: createdTweet } = await this.userClient.v2.tweet(text, {
        media: media ? { media_ids: [media] } : undefined,
      })

      return createdTweet
    } catch (e) {
      console.error(e)
      return 'error'
    }
  }

  public async thread(tweets: { text: string, imageUrl?: string }[]) {
    if (! Application.inProduction) return Logger.debug(`Not sending tweets in development`)

    // Upload media items and prepare data
    const withMedia: { text?: string, media?: { media_ids: string[] } }[] = []
    for (const config of tweets) {
      const media = await this.uploadMedia(config.imageUrl)

      withMedia.push({ text: config.text, media: media ? { media_ids: [media] } : undefined })
    }

    // Send it
    await this.userClient.v2.tweetThread(withMedia)
  }

  public async media (imageUrl: string) {
    if (! Application.inProduction) return Logger.debug(`Not sending tweets in development`)

    const media = await this.uploadMedia(imageUrl)

    return media
  }

  private async uploadMedia (url?: string): Promise<string|null> {
    if (! url) return null

    const { contentType, buffer } = await this.loadImage(url)

    try {
      const mediaId = await this.appClient.v1.uploadMedia(buffer, {
        mimeType: contentType,
        additionalOwners: [this.account.oauth.twitterUser?.id as string]
      })

      return mediaId
    } catch (e) {
      Logger.error(e)

      return null
    }
  }

  private async loadImage (url: string) {
    const response = await axios.get(url,  { responseType: 'arraybuffer' })

    let contentType = response.headers['content-type']
    let buffer = response.data

    return {
      contentType,
      buffer,
    }
  }
}
