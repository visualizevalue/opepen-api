import BaseSchema from '@ioc:Adonis/Lucid/Schema'
import { DateTime } from 'luxon'

const DEFAULT_MODELS = [
  {
    name: 'stability-ai/stable-diffusion-img2img',
    version: '15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d',
  },
  {
    name: 'jagilley/controlnet-hed',
    version: 'cde353130c86f37d0af4060cd757ab3009cac68eb58df216768f907f0d0a0653',
  },
  {
    name: 'jagilley/controlnet-depth2img',
    version: '922c7bb67b87ec32cbc2fd11b1d5f94f0ba4f5519c4dbd02856376444127cc60',
  },
]

export default class extends BaseSchema {
  protected tableName = 'ai_models'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name')
      table.string('version')

      table.timestamp('created_at', { useTz: true })
    })

    // Create the default models
    this.defer(async (db) => {
      for (const model of DEFAULT_MODELS) {
        await db.table('ai_models').insert({...model, created_at: DateTime.now() })
      }
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
