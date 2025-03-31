import Logger from '@ioc:Adonis/Core/Logger'
import { BaseModel, BelongsTo, HasMany, belongsTo, column, hasMany } from '@ioc:Adonis/Lucid/Orm'
import NotifyNewSetEmail from 'App/Mailers/NotifyNewSetEmail'
import Account from 'App/Models/Account'
import Opepen from 'App/Models/Opepen'
import SetSubmission from 'App/Models/SetSubmission'
import BotNotifications from 'App/Services/BotNotifications'

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
           .preload('coCreators', (query) => query.preload('account'))
           .preload('dynamicPreviewImage')
           .preload('richContentLinks', query => {
             query.preload('logo')
             query.preload('cover')
             query.orderBy('sortIndex')
           })
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
           .preload('coCreators', (query) => query.preload('account'))
    }
  })
  public replacedSubmission: BelongsTo<typeof SetSubmission>

  @hasMany(() => Opepen, {
    foreignKey: 'setId',
    localKey: 'id',
  })
  public opepen: HasMany<typeof Opepen>

  public async notifyPublished () {
    const users = await Account.query().withScopes(scopes => scopes.receivesEmail('NewSet'))

    for (const user of users) {
      try {
        await new NotifyNewSetEmail(user, this).sendLater()
        Logger.info(`SetNotification email scheduled: ${user.email}`)
      } catch (e) {
        Logger.warn(`Error scheduling SetNotification email: ${user.email}`)
      }
    }

    await BotNotifications?.newSet(this)
  }
}
