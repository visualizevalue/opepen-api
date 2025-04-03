import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Database, { Dictionary } from '@ioc:Adonis/Lucid/Database'
import { chunk } from 'App/Helpers/arrays'
import { parse } from 'csv-parse/sync'
import fs from 'fs'

export default class ImportOpepenEvents extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:import-events'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Import Events from a CSV'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  @args.string()
  public path: string

  public async run() {
    const { default: Account } = await import('App/Models/Account')

    const records = parse(fs.readFileSync(this.path), {
      columns: true,
      skip_empty_lines: true,
    })

    const events = records.map((row) => ({
      token_id: row.token_id,
      type: row.type,
      from: row.from,
      to: row.to,
      transaction_hash: row.transaction_hash,
      log_index: row.log_index,
      block_number: row.block_number,
      timestamp: row.timestamp,
      contract: 'OPEPEN',
    }))

    const holders = new Set<string>([...events.map((d) => d.to), ...events.map((d) => d.from)])
    const chunkedHolders = chunk(
      Array.from(holders.values()).map((address) => ({ address })),
      1000,
    )
    for (const chunk of chunkedHolders) {
      await Account.updateOrCreateMany('address', chunk)
      this.logger.info(`Imported 1000 accounts`)
    }

    const chunkedEvents = chunk(events, 1000)
    for (const chunk of chunkedEvents) {
      await Database.table('events').multiInsert(chunk as Dictionary<any, string>[])
      this.logger.info(`Imported 1000 events`)
    }
  }
}
