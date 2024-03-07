import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Image from './Image'

export default class DynamicSetImages extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public image_1_1_id: bigint

  @column({ serializeAs: null })
  public image_4_1_id: bigint

  @column({ serializeAs: null })
  public image_4_2_id: bigint

  @column({ serializeAs: null })
  public image_4_3_id: bigint

  @column({ serializeAs: null })
  public image_4_4_id: bigint

  @column({ serializeAs: null })
  public image_5_1_id: bigint

  @column({ serializeAs: null })
  public image_5_2_id: bigint

  @column({ serializeAs: null })
  public image_5_3_id: bigint

  @column({ serializeAs: null })
  public image_5_4_id: bigint

  @column({ serializeAs: null })
  public image_5_5_id: bigint

  @column({ serializeAs: null })
  public image_10_1_id: bigint

  @column({ serializeAs: null })
  public image_10_2_id: bigint

  @column({ serializeAs: null })
  public image_10_3_id: bigint

  @column({ serializeAs: null })
  public image_10_4_id: bigint

  @column({ serializeAs: null })
  public image_10_5_id: bigint

  @column({ serializeAs: null })
  public image_10_6_id: bigint

  @column({ serializeAs: null })
  public image_10_7_id: bigint

  @column({ serializeAs: null })
  public image_10_8_id: bigint

  @column({ serializeAs: null })
  public image_10_9_id: bigint

  @column({ serializeAs: null })
  public image_10_10_id: bigint

  @column({ serializeAs: null })
  public image_20_1_id: bigint

  @column({ serializeAs: null })
  public image_20_2_id: bigint

  @column({ serializeAs: null })
  public image_20_3_id: bigint

  @column({ serializeAs: null })
  public image_20_4_id: bigint

  @column({ serializeAs: null })
  public image_20_5_id: bigint

  @column({ serializeAs: null })
  public image_20_6_id: bigint

  @column({ serializeAs: null })
  public image_20_7_id: bigint

  @column({ serializeAs: null })
  public image_20_8_id: bigint

  @column({ serializeAs: null })
  public image_20_9_id: bigint

  @column({ serializeAs: null })
  public image_20_10_id: bigint

  @column({ serializeAs: null })
  public image_20_11_id: bigint

  @column({ serializeAs: null })
  public image_20_12_id: bigint

  @column({ serializeAs: null })
  public image_20_13_id: bigint

  @column({ serializeAs: null })
  public image_20_14_id: bigint

  @column({ serializeAs: null })
  public image_20_15_id: bigint

  @column({ serializeAs: null })
  public image_20_16_id: bigint

  @column({ serializeAs: null })
  public image_20_17_id: bigint

  @column({ serializeAs: null })
  public image_20_18_id: bigint

  @column({ serializeAs: null })
  public image_20_19_id: bigint

  @column({ serializeAs: null })
  public image_20_20_id: bigint

  @column({ serializeAs: null })
  public image_40_1_id: bigint

  @column({ serializeAs: null })
  public image_40_2_id: bigint

  @column({ serializeAs: null })
  public image_40_3_id: bigint

  @column({ serializeAs: null })
  public image_40_4_id: bigint

  @column({ serializeAs: null })
  public image_40_5_id: bigint

  @column({ serializeAs: null })
  public image_40_6_id: bigint

  @column({ serializeAs: null })
  public image_40_7_id: bigint

  @column({ serializeAs: null })
  public image_40_8_id: bigint

  @column({ serializeAs: null })
  public image_40_9_id: bigint

  @column({ serializeAs: null })
  public image_40_10_id: bigint

  @column({ serializeAs: null })
  public image_40_11_id: bigint

  @column({ serializeAs: null })
  public image_40_12_id: bigint

  @column({ serializeAs: null })
  public image_40_13_id: bigint

  @column({ serializeAs: null })
  public image_40_14_id: bigint

  @column({ serializeAs: null })
  public image_40_15_id: bigint

  @column({ serializeAs: null })
  public image_40_16_id: bigint

  @column({ serializeAs: null })
  public image_40_17_id: bigint

  @column({ serializeAs: null })
  public image_40_18_id: bigint

  @column({ serializeAs: null })
  public image_40_19_id: bigint

  @column({ serializeAs: null })
  public image_40_20_id: bigint

  @column({ serializeAs: null })
  public image_40_21_id: bigint

  @column({ serializeAs: null })
  public image_40_22_id: bigint

  @column({ serializeAs: null })
  public image_40_23_id: bigint

  @column({ serializeAs: null })
  public image_40_24_id: bigint

  @column({ serializeAs: null })
  public image_40_25_id: bigint

  @column({ serializeAs: null })
  public image_40_26_id: bigint

  @column({ serializeAs: null })
  public image_40_27_id: bigint

  @column({ serializeAs: null })
  public image_40_28_id: bigint

  @column({ serializeAs: null })
  public image_40_29_id: bigint

  @column({ serializeAs: null })
  public image_40_30_id: bigint

  @column({ serializeAs: null })
  public image_40_31_id: bigint

  @column({ serializeAs: null })
  public image_40_32_id: bigint

  @column({ serializeAs: null })
  public image_40_33_id: bigint

  @column({ serializeAs: null })
  public image_40_34_id: bigint

  @column({ serializeAs: null })
  public image_40_35_id: bigint

  @column({ serializeAs: null })
  public image_40_36_id: bigint

  @column({ serializeAs: null })
  public image_40_37_id: bigint

  @column({ serializeAs: null })
  public image_40_38_id: bigint

  @column({ serializeAs: null })
  public image_40_39_id: bigint

  @column({ serializeAs: null })
  public image_40_40_id: bigint


  @belongsTo(() => Image, { foreignKey: 'image_1_1_id' })
  public image1_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_4_1_id' })
  public image4_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_4_2_id' })
  public image4_2: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_4_3_id' })
  public image4_3: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_4_4_id' })
  public image4_4: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_5_1_id' })
  public image5_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_5_2_id' })
  public image5_2: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_5_3_id' })
  public image5_3: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_5_4_id' })
  public image5_4: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_5_5_id' })
  public image5_5: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_1_id' })
  public image10_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_2_id' })
  public image10_2: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_3_id' })
  public image10_3: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_4_id' })
  public image10_4: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_5_id' })
  public image10_5: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_6_id' })
  public image10_6: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_7_id' })
  public image10_7: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_8_id' })
  public image10_8: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_9_id' })
  public image10_9: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_10_10_id' })
  public image10_10: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_1_id' })
  public image20_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_2_id' })
  public image20_2: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_3_id' })
  public image20_3: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_4_id' })
  public image20_4: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_5_id' })
  public image20_5: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_6_id' })
  public image20_6: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_7_id' })
  public image20_7: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_8_id' })
  public image20_8: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_9_id' })
  public image20_9: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_10_id' })
  public image20_10: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_11_id' })
  public image20_11: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_12_id' })
  public image20_12: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_13_id' })
  public image20_13: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_14_id' })
  public image20_14: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_15_id' })
  public image20_15: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_16_id' })
  public image20_16: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_17_id' })
  public image20_17: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_18_id' })
  public image20_18: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_19_id' })
  public image20_19: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_20_20_id' })
  public image20_20: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_1_id' })
  public image40_1: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_2_id' })
  public image40_2: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_3_id' })
  public image40_3: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_4_id' })
  public image40_4: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_5_id' })
  public image40_5: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_6_id' })
  public image40_6: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_7_id' })
  public image40_7: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_8_id' })
  public image40_8: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_9_id' })
  public image40_9: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_10_id' })
  public image40_10: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_11_id' })
  public image40_11: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_12_id' })
  public image40_12: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_13_id' })
  public image40_13: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_14_id' })
  public image40_14: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_15_id' })
  public image40_15: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_16_id' })
  public image40_16: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_17_id' })
  public image40_17: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_18_id' })
  public image40_18: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_19_id' })
  public image40_19: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_20_id' })
  public image40_20: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_21_id' })
  public image40_21: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_22_id' })
  public image40_22: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_23_id' })
  public image40_23: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_24_id' })
  public image40_24: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_25_id' })
  public image40_25: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_26_id' })
  public image40_26: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_27_id' })
  public image40_27: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_28_id' })
  public image40_28: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_29_id' })
  public image40_29: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_30_id' })
  public image40_30: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_31_id' })
  public image40_31: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_32_id' })
  public image40_32: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_33_id' })
  public image40_33: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_34_id' })
  public image40_34: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_35_id' })
  public image40_35: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_36_id' })
  public image40_36: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_37_id' })
  public image40_37: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_38_id' })
  public image40_38: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_39_id' })
  public image40_39: BelongsTo<typeof Image>

  @belongsTo(() => Image, { foreignKey: 'image_40_40_id' })
  public image40_40: BelongsTo<typeof Image>
}
