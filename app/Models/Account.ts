import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'
import { afterSave, BaseModel, beforeSave, BelongsTo, belongsTo, column, computed, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Address from 'App/Helpers/Address'
import provider from 'App/Services/RPCProvider'
import Image from 'App/Models/Image'
import SetSubmission from 'App/Models/SetSubmission'
import RichContentLink from 'App/Models/RichContentLink'
import { ArtistSocials, OauthData } from './types'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public address: string

  @column()
  public name: string

  @column()
  public ens: string

  @column()
  public data: object

  @column({ serializeAs: null })
  public oauth: OauthData

  @column({ serializeAs: null })
  public email: string

  @column.dateTime({ serializeAs: null })
  public emailVerifiedAt: DateTime|null

  @column({ serializeAs: null })
  public notificationNewSet: boolean

  @column()
  public pfpImageId: bigint|null

  @column()
  public coverImageId: bigint|null

  @column()
  public tagline: string

  @column()
  public quote: string

  @column()
  public bio: string

  @column({
    consume: (value: string) => typeof value === 'string' ? JSON.parse(value) : value,
    prepare: (value: any) => Array.isArray(value) ? JSON.stringify(value) : value,
  })
  public socials: ArtistSocials

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get twitterHandle () {
    return this.oauth.twitterUser?.username
  }

  @computed()
  public get display () {
    if (this.name) return this.name
    if (this.ens) return this.ens

    return Address.short(this.address)
  }

  @belongsTo(() => Image, {
    foreignKey: 'pfpImageId',
  })
  public pfp: BelongsTo<typeof Image>

  @belongsTo(() => Image, {
    foreignKey: 'coverImageId',
  })
  public coverImage: BelongsTo<typeof Image>

  @hasMany(() => RichContentLink, {
    foreignKey: 'address',
    localKey: 'address',
  })
  public richContentLinks: HasMany<typeof RichContentLink>

  @hasMany(() => SetSubmission, {
    foreignKey: 'creator',
    localKey: 'address',
    onQuery: query => {
      query.preload('edition1Image')
      query.preload('edition4Image')
      query.preload('edition5Image')
      query.preload('edition10Image')
      query.preload('edition20Image')
      query.preload('edition40Image')
      query.orderBy('id')
    }
  })
  public createdSets: HasMany<typeof SetSubmission>

  @beforeSave()
  public static async lowerCaseAddress(account: Account) {
    account.address = account.address.toLowerCase()
  }

  @afterSave()
  public static async saveNames (account: Account) {
    if (! Env.get('UPDATE_ENS')) {
      return
    }

    await Promise.all([
      account.updateENS(),
    ])

    try {
      await account.save()
    } catch (e) {
      Logger.error(e)
    }
  }

  public async updateNames () {
    const timeAgo = Math.floor((Date.now() - +this.updatedAt) / 1000)
    if (timeAgo < 60 * 10) { // wait for 10 minutes between updates
      Logger.info(`Don't update names for ${this.address}, as we've updated them ${timeAgo} seconds ago`)
      return
    }

    await Promise.all([
      this.updateENS(),
    ])

    // Force update updatedAt
    this.updatedAt = DateTime.now()

    try {
      await this.save()
    } catch (e) {
      Logger.error(e)
    }

    return this
  }

  public async updateENS () {
    try {
      this.ens = await provider.lookupAddress(this.address) || ''

      if (this.ens) Logger.info(`ENS for ${this.ens} updated`)
    } catch (e) {
      Logger.error(e)
    }
  }

  static byId (id) {
    return this.query()
      .where('address', id?.toLowerCase())
      .orWhere('ens', id?.toLowerCase())
      .preload('pfp')
  }
}
