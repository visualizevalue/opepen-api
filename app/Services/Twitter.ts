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

  constructor (config: { appClient: TwitterApi, userClient: TwitterApi }) {
    this.appClient = config.appClient
    this.userClient = config.userClient
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
      const {
        accessToken,
        refreshToken,
        expiresIn,
      } = await appClient.refreshOAuth2Token(account.oauth.refreshToken)

      userAccessToken = accessToken

      account.oauth.accessToken = accessToken
      account.oauth.refreshToken = refreshToken
      account.oauth.expiresAt = DateTime.now().plus({ seconds: expiresIn - 30 }).toISO()

      await account.save()
    }

    const userClient = new TwitterApi(userAccessToken)

    return new Twitter({ appClient, userClient })
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

  public async media (imageUrl: string) {
    if (! Application.inProduction) return Logger.debug(`Not sending tweets in development`)

    const media = await this.uploadMedia(imageUrl)

    return media
  }

  private async uploadMedia (url?: string): Promise<string|null> {
    if (! url) return null

    const { contentType, buffer } = await this.loadImage(url)

    try {
      const mediaId = await this.appClient.v1.uploadMedia(buffer, { mimeType: contentType })

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
