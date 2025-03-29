import axios from 'axios'
import { TwitterApi } from 'twitter-api-v2'
import Env from '@ioc:Adonis/Core/Env'
import Logger from '@ioc:Adonis/Core/Logger'
import { DateTime } from 'luxon'
import Account from 'App/Models/Account'

type Media = [string]|[string,string]|[string,string,string]|[string,string,string,string]|undefined

export default class Twitter {
  private userClient: TwitterApi
  // @ts-ignore
  private account: Account

  constructor (config: {
    userClient: TwitterApi,
    account: Account
  }) {
    this.userClient = config.userClient
    this.account = config.account
  }

  static async initialize (account: Account) {
    if (! account.oauth.accessToken || ! account.oauth.refreshToken) return

    let userAccessToken: string = account.oauth.accessToken

    const isExpired = DateTime.fromISO(account.oauth.expiresAt as string).diff(DateTime.now()).as('minutes') < 10
    Logger.info(`${account.oauth.twitterUser?.name} token expires ${account.oauth.expiresAt}: ${isExpired ? 'expired' : 'active'}`)
    if (isExpired) {
      Logger.info(`Twitter token for ${account.address} expired, refreshing`)

      const oauthClient = new TwitterApi({
        clientId: Env.get('TWITTER_CLIENT_ID'),
        clientSecret: Env.get('TWITTER_CLIENT_SECRET'),
      })

      try {
        const {
          accessToken,
          refreshToken,
          expiresIn,
        } = await oauthClient.refreshOAuth2Token(account.oauth.refreshToken)

        Logger.info(`Fetched fresh Twitter auth tokens for ${account.address}`)

        userAccessToken = accessToken

        account.oauth.accessToken = accessToken
        account.oauth.refreshToken = refreshToken
        account.oauth.expiresAt = DateTime.now().plus({ seconds: expiresIn - 30 }).toISO()

        await account.save()
      } catch (e) {
        Logger.info(`Error refreshing Twitter auth tokens for ${account.address}: ${e}`)
      }
    }

    const userClient = new TwitterApi(userAccessToken)

    return new Twitter({ userClient, account })
  }

  public async tweet (text: string, imageUrls?: string|string[]) {
    Logger.info(`Twitter.tweet() ${text}, ${imageUrls}`)
    const mediaURLs = Array.isArray(imageUrls) ? imageUrls : [imageUrls]
    try {
      const media = (await Promise.all(mediaURLs.map(url => this.uploadMedia(url))))
        .filter(m => !!m) as string[]

      Logger.info(`Uploaded media: ${media}`)

      const config = { media: media?.length ? { media_ids: media as Media } : undefined }

      Logger.info(`Tweet txt: "${text}"`)
      Logger.info(`Tweet config: ${JSON.stringify(config)}`)

      const { data: createdTweet } = await this.userClient.v2.tweet(text, config)

      Logger.info(`Sent tweet: ${JSON.stringify(createdTweet)}`)

      return createdTweet
    } catch (e) {
      Logger.error(`Error sending tweet: ${e}`)
      return 'error'
    }
  }

  public async thread(tweets: { text: string, images?: string|string[] }[]) {
    // Upload media items and prepare data
    const withMedia: { text?: string, media?: { media_ids: Media } }[] = []
    for (const config of tweets) {
      const media_ids: string[] = []
      const addMedia = async (url) => {
        const media = await this.uploadMedia(url)

        if (media) media_ids.push(media)
      }

      if (Array.isArray(config.images)) {
        for (const url of config.images) {
          await addMedia(url)
        }
      } else if (typeof config.images === 'string') {
        await addMedia(config.images)
      }

      withMedia.push({ text: config.text, media: media_ids.length ? { media_ids: media_ids as Media } : undefined })
    }

    // Send it
    try {
      await this.userClient.v2.tweetThread(withMedia)
    } catch (e) {
      Logger.error(`Error sending twitter thread: ${e}`)
    }
  }

  public async media (imageUrl: string) {
    const media = await this.uploadMedia(imageUrl)

    return media
  }

  private async uploadMedia (url?: string): Promise<string|null> {
    if (! url) return null

    const { contentType, buffer } = await this.loadImage(url)

    try {
      const mediaId = await this.userClient.v2.uploadMedia(buffer, { media_type: contentType })

      return mediaId
    } catch (e) {
      Logger.error(`Media upload error: ${e}`)

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
