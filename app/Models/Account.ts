import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'
import { afterSave, BaseModel, beforeSave, column, computed, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Address from 'App/Helpers/Address'
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

  @column({ serializeAs: null })
  public email: string

  @column({ serializeAs: null })
  public notification_new_set: boolean

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get display () {
    if (this.ens) return this.ens

    return Address.short(this.address)
  }

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
  }
}
