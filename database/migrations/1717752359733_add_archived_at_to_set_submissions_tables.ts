import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'set_submissions'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.timestamp('last_opt_in_at', { useTz: true })
      table.timestamp('archived_at', { useTz: true })
    })

    this.defer(async db => {
      const submissions = await db.from('set_submissions')
        .whereNotNull('published_at')
        .whereNotNull('approved_at')

      for (const submission of submissions) {
        const lastSubscription = await db.from('set_subscriptions')
          .where('submission_id', submission.id)
          .orderBy('created_at', 'desc')
          .first()

        if (lastSubscription) {
          await db.from('set_submissions')
            .where('id', submission.id)
            .update({
              last_opt_in_at: lastSubscription.created_at
            })
        }
      }
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('last_opt_in_at')
      table.dropColumn('archived_at')
    })
  }
}
