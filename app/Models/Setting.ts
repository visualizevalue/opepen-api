import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

const SettingsKeys = {
  METADATA_CONTRACT: 'metadata:contract',
  METADATA_BASE:     'metadata:base',
  METADATA_EDITIONS: 'metadata:editions',
}

type SettingKey      = keyof typeof SettingsKeys
type SettingKeyValue = typeof SettingsKeys[SettingKey]

export default class Setting extends BaseModel {
  public static table = 'app_settings'

  @column({ isPrimary: true })
  public id: number

  @column()
  public key: SettingKeyValue

  @column()
  public data: { [key: string]: any }

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  /**
   * Get a setting instance by its key.
   *
   * @param key The setting key
   * @returns The setting model
   */
  public static async get (key: SettingKey) {
    return await Setting.findByOrFail('key', SettingsKeys[key])
  }
}
