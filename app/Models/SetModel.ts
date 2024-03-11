import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Opepen from 'App/Models/Opepen'
import SetSubmission from 'App/Models/SetSubmission'

export default class SetModel extends BaseModel {
  public static table = 'sets'

  @column({ isPrimary: true })
  public id: number

  @column({ serializeAs: null })
  public submissionId: number

  @column({ serializeAs: null })
  public replacedSubmissionId: number

  @belongsTo(() => SetSubmission, {
    foreignKey: 'submissionId',
    onQuery: query => {
      query.preload('edition1Image')
           .preload('edition4Image')
           .preload('edition5Image')
           .preload('edition10Image')
           .preload('edition20Image')
           .preload('edition40Image')
           .preload('creatorAccount')
           .preload('dynamicPreviewImage')
    }
  })
  public submission: BelongsTo<typeof SetSubmission>

  @belongsTo(() => SetSubmission, {
    foreignKey: 'replacedSubmissionId',
    onQuery: query => {
      query.preload('edition1Image')
           .preload('edition4Image')
           .preload('edition5Image')
           .preload('edition10Image')
           .preload('edition20Image')
           .preload('edition40Image')
           .preload('creatorAccount')
    }
  })
  public replacedSubmission: BelongsTo<typeof SetSubmission>

  @hasMany(() => Opepen, {
    foreignKey: 'setId',
    localKey: 'id',
  })
  public opepen: HasMany<typeof Opepen>

  // // FIXME: Refactor out
  // import Logger from '@ioc:Adonis/Core/Logger'
  // import Account from 'App/Models/Account'
  // import NotifyNewSetEmail from 'App/Mailers/NotifyNewSetEmail'
  //
  // public async notifyPublished () {
  //   const users = await Account.query()
  //     .whereNotNull('email')
  //     .whereNotNull('emailVerifiedAt')
  //     .where('notificationNewSet', true)

  //   for (const user of users) {
  //     try {
  //       await new NotifyNewSetEmail(user, this).sendLater()
  //       Logger.info(`SetNotification email scheduled: ${user.email}`)
  //     } catch (e) {
  //       Logger.warn(`Error scheduling SetNotification email: ${user.email}`)
  //     }
  //   }
  // }
}
