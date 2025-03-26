import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import BaseController from "./BaseController";
import TwitterPublic from "App/Services/TwitterPublic";
import CuratedTweet from "App/Models/CuratedTweet";
import { DateTime } from "luxon";

export default class CuratedTweetsController extends BaseController {
  public async store({ request, response }: HttpContextContract) {
    const { ids } = request.only(["ids"]);
    if (!Array.isArray(ids) || !ids.length) {
      return response.status(400).json({ error: "No tweet IDs provided" });
    }

    const twitterClient = new TwitterPublic();

    const twitterResponse = await twitterClient.getTweetsByIds(ids);

    if (!twitterResponse || !twitterResponse.data?.length) {
      return response.status(404).json({ error: "No data returned from Twitter" });
    }

    const usersById: Record<string, any> = {};
    if (twitterResponse.includes?.users) {
      for (const user of twitterResponse.includes.users) {
        usersById[user.id] = user;
      }
    }

    const mediaByKey: Record<string, any> = {};
    if (twitterResponse.includes?.media) {
      for (const m of twitterResponse.includes.media) {
        mediaByKey[m.media_key] = m;
      }
    }

    const results: CuratedTweet[] = [];
    for (const tweet of twitterResponse.data) {
      const user = tweet.author_id ? usersById[tweet.author_id] : null;
      
      let mediaUrls: any[] = [];
      if (tweet.attachments?.media_keys?.length) {
        for (const key of tweet.attachments.media_keys) {
          const mediaObj = mediaByKey[key];
          if (mediaObj) {
            mediaUrls.push({
              type: mediaObj.type,
              url: mediaObj.url || mediaObj.preview_image_url || null,
              variants: mediaObj.variants || null,
            });
          }
        }
      }

      const curatedTweet = await CuratedTweet.firstOrCreate(
        { tweetId: tweet.id },
        {
          authorId: tweet.author_id,
          text: tweet.text,
          username: user?.username || null,
          name: user?.name || null,
          profileImageUrl: user?.profile_image_url || null,
          tweetCreatedAt: tweet.created_at
            ? DateTime.fromISO(tweet.created_at)
            : null,
          mediaUrls,
        }
      );

      results.push(curatedTweet);
    }

    return results;
  }

  public async index({ request }: HttpContextContract) {
    const { sort = "" } = request.qs();
    const query = CuratedTweet.query();
    await this.applySorts(query, sort);
    return query;
  }

  public async destroy({ params, response }: HttpContextContract) {
    try {
      const tweet = await CuratedTweet.findOrFail(params.id);
      await tweet.delete();
      return { success: true, deletedId: params.id };
    } catch (e) {
      return response.status(404).json({ error: "Tweet not found" });
    }
  }
}
