import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import { afterSave, BaseModel, beforeSave, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import provider from 'App/Services/RPCProvider'
import Journey from './Journey'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public address: string

  @column()
  public ens: string

  @column()
  public data: object

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Journey, {
    foreignKey: 'owner',
    localKey: 'address',
  })
  public journeys: HasMany<typeof Journey>

  @beforeSave()
  public static async lowerCaseAddress(account: Account) {
    account.address = account.address.toLowerCase()
  }

  @afterSave()
  public static async saveNames (account: Account) {
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

      if (! this.ens) return

      const resolver = await provider.getResolver(this.ens)
      if (! resolver) return
      let contentHash: string|null = null
      try {
        contentHash = await resolver.getContentHash()
      } catch (e) {
        Logger.warn(`Couldn't resolve content hash ` + e.message)
      }
      const [
        avatar,
        description,
        email,
        header,
        keywords,
        notice,
        url,
        github,
        twitter,
        discord,
        ensDelegate,
      ] = await Promise.all([
        resolver.getText('avatar'),
        resolver.getText('description'),
        resolver.getText('email'),
        resolver.getText('header'),
        resolver.getText('keywords'),
        resolver.getText('notice'),
        resolver.getText('url'),
        // com
        resolver.getText('com.github'),
        resolver.getText('com.twitter'),
        resolver.getText('com.discord'),
        resolver.getText('eth.ens.delegate'),
      ])
      this.data = {
        contentHash,
        avatar,
        description,
        email,
        header,
        keywords,
        notice,
        url,
        // com
        github,
        twitter,
        discord,
        ensDelegate,
      }
    } catch (e) {
      Logger.error(e)
    }

    Logger.info(`ENS for ${this.ens} updated`)
  }

  static byId (id) {
    return this.query()
      .where('address', id)
      .orWhere('ens', id)
  }
}
