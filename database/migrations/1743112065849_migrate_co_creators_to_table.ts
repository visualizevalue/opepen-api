import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import Database from '@ioc:Adonis/Lucid/Database'
import Account from 'App/Models/Account'

export default class extends BaseSchema {
  protected submissionsTable = 'set_submissions'
  protected coCreatorsTable = 'co_creators'

  public async up() {
    const submissions = await Database.from(this.submissionsTable).select(
      'id',
      'co_creator_1',
      'co_creator_2',
      'co_creator_3',
      'co_creator_4',
      'co_creator_5',
    )

    for (const submission of submissions) {
      for (let i = 1; i <= 5; i++) {
        const address = submission[`co_creator_${i}`]
        if (!address) continue

        const account = await Account.firstOrCreate({ address: address.toLowerCase() })

        await Database.table(this.coCreatorsTable).insert({
          set_submission_id: submission.id,
          account_id: account.id,
        })
      }
    }
  }

  public async down() {
    const cocreators = await Database.from(this.coCreatorsTable).select(
      'set_submission_id',
      'account_id',
    )

    const grouped: Record<number, string[]> = {}

    for (const row of cocreators) {
      const account = await Account.find(row.account_id)
      if (!account) continue

      if (!grouped[row.set_submission_id]) {
        grouped[row.set_submission_id] = []
      }

      grouped[row.set_submission_id].push(account.address)
    }

    for (const [submissionIdStr, addresses] of Object.entries(grouped)) {
      const submissionId = parseInt(submissionIdStr, 10)
      const [a1, a2, a3, a4, a5] = addresses

      await Database.from(this.submissionsTable)
        .where('id', submissionId)
        .update({
          co_creator_1: a1 ?? null,
          co_creator_2: a2 ?? null,
          co_creator_3: a3 ?? null,
          co_creator_4: a4 ?? null,
          co_creator_5: a5 ?? null,
        })
    }

    await Database.from(this.coCreatorsTable).delete()
  }
}
