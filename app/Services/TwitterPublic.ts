import { TwitterApiReadOnly } from "twitter-api-v2";
import Env from "@ioc:Adonis/Core/Env";
import Logger from "@ioc:Adonis/Core/Logger";

export default class TwitterPublic {
  private client: TwitterApiReadOnly;

  constructor() {
    const bearer = Env.get("TWITTER_BEARER");
    
    this.client = new TwitterApiReadOnly(bearer);
  }

  public async getTweetsByIds(tweetIds: string[]) {
    if (!tweetIds.length) {
      return { data: [], includes: {} };
    }

    try {
      const response = await this.client.v2.tweets(tweetIds, {
        expansions: ["author_id", "attachments.media_keys"],
        "tweet.fields": ["author_id", "text", "created_at"],
        "media.fields": ["type", "url", "preview_image_url", "variants"],
        "user.fields": ["name", "username", "profile_image_url"],
      });
      console.log(response)
      return response;
    } catch (err) {
      Logger.error(`Error fetching tweets: ${err}`);
      return null;
    }
  }
}
