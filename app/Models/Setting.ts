import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export const SETTINGS_KEYS = {
  METADATA_CONTRACT: 'metadata:contract',
  METADATA_BASE:     'metadata:base',
  METADATA_EDITIONS: 'metadata:editions',
  NOTIFICATION_NODES: 'nodes:notification',
  NOTIFICATION_NEW_SETS: 'new_sets:notification',
}

type SettingKey      = keyof typeof SETTINGS_KEYS
type SettingKeyValue = typeof SETTINGS_KEYS[SettingKey]

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
    return await Setting.findByOrFail('key', SETTINGS_KEYS[key])
  }
}
