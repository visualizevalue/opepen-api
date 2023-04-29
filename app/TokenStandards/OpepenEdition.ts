import Env from '@ioc:Adonis/Core/Env'
import Opepen from 'App/Models/Opepen'
import ZoraEdition from './ZoraEdition'

const ADDRESS = Env.get('OPEPEN_ADDRESS')
const NAME = 'OPEPEN'
const START_BLOCK = Env.get('OPEPEN_START_BLOCK')
const INTERVAL = 60_000
const MODEL = Opepen

export default class OpepenEdition extends ZoraEdition {
  constructor () {
    super(
      ADDRESS,
      NAME,
      START_BLOCK,
      MODEL,
      INTERVAL,
    )
  }

  public static async initialize (): Promise<ZoraEdition> {
    return super.initialize(ADDRESS, NAME, START_BLOCK, MODEL, INTERVAL)
  }
}
