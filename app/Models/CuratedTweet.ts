import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import { MediaItem } from './types'

export default class CuratedTweet extends BaseModel {
  @column({ isPrimary: true })
  public id: number
  
  @column()
  public tweetId: string

  @column()
  public authorId: string

  @column()
  public username: string | null

  @column()
  public name: string | null

  @column()
  public profileImageUrl: string | null

  @column()
  public text: string

  @column.dateTime()
  public tweetCreatedAt: DateTime | null

  @column({
    prepare: (value: MediaItem[] | null) => (value ? JSON.stringify(value) : null),
  })
  public mediaUrls: MediaItem[] | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime
}
