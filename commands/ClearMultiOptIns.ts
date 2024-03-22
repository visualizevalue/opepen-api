import { BaseCommand } from '@adonisjs/core/build/standalone'
import Database from '@ioc:Adonis/Lucid/Database'
import SetSubmission from 'App/Models/SetSubmission'

export default class ClearMultiOptIns extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'clear:multi_opt_ins'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const latestOptIns = await Database.rawQuery(`
      SELECT DISTINCT ON (id)
        id,
        address,
        submission_id,
        created_at
      FROM (
        SELECT
          jsonb_array_elements_text("opepen_ids") as id,
          address,
          subs.created_at,
          submission_id
        FROM set_subscriptions AS subs
        INNER JOIN set_submissions AS subm ON subs.submission_id = subm.id
        WHERE set_id IS NULL
        ORDER BY created_at DESC
      ) as t
      ORDER BY
        id,
        created_at DESC
    `)

    for (const opt of latestOptIns.rows) {
      await Database.rawQuery(`
        UPDATE set_subscriptions
        SET opepen_ids = opepen_ids - '{${opt.id}}'::text[]
        WHERE opepen_ids \\?| '{${opt.id}}'::text[]
        AND (
          submission_id != ${opt.submission_id}
          OR address != '${opt.address}'
        )
        AND submission_id NOT IN (SELECT submission_id FROM sets WHERE submission_id IS NOT NULL)
      `)

      this.logger.info(`Cleared all opt ins for ${opt.id} except to set ${opt.submission_id}`)
    }

    const activeSets = await SetSubmission.query().withScopes(scopes => scopes.prereveal())

    for (const set of activeSets) {
      await set.updateAndValidateOpepensInSet()

      this.logger.info(`Recomputed current stats on ${set.name}; reveals at: ${set.revealsAt}; remaining time: ${set.remainingRevealTime}`)
    }
  }
}
