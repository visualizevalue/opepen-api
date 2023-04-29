import { ethers } from 'ethers'
import abi from './abis/ERC721.json'
import provider, { getBlockTimestamp } from '../Services/RPCProvider'
import Contract from './Contract'
import Account from 'App/Models/Account'
import Event from 'App/Models/Event'
import { delay } from 'App/Helpers/time'
import { Class, ContractType } from 'App/Models/types'
import TokenModel from 'App/Models/TokenModel'
import { LucidModel } from '@ioc:Adonis/Lucid/Orm'

const EVENTS = ['Transfer']

export default class ZoraEdition extends Contract {
  public address: string
  public name: ContractType
  public startBlock: number
  public interval: number
  public model: Class<TokenModel>

  constructor (address: string, name: ContractType, startBlock: number, model: Class<TokenModel>, interval: number = 13_000) {
    super()
    this.address = address
    this.name = name
    this.startBlock = startBlock
    this.model = model
    this.interval = interval
  }

  public static async initialize (
    address: string, name: ContractType, startBlock: number, model: Class<TokenModel>, interval: number = 13_000
  ): Promise<ZoraEdition> {
    const instance = new ZoraEdition(address, name, startBlock, model, interval)
    instance.contract = await new ethers.Contract(address, Array.from(abi), provider)

    return instance
  }

  public async track () {
    while (true) {
      await this.sync()
      await delay(this.interval)
    }
  }

  public async sync () {
    for (const event of EVENTS) {
      const lastEvent = await Event.getLastOfType(event, this.name)
      const startBlock = lastEvent
        ? parseInt(lastEvent.blockNumber) + 1
        : this.startBlock
      await this.syncEvents(startBlock, event, this[`on${event}`])
    }
  }

  protected async onTransfer (event: ethers.Event) {
    if (! event.args) {
      console.log(`Error: no args in event`)
      return
    }

    const tokenId = event.args.tokenId.toString()
    const previousOwner = event.args.from.toLowerCase()
    const newOwner = event.args.to.toLowerCase()

    await Account.updateOrCreate({ address: previousOwner }, {})
    await Account.updateOrCreate({ address: newOwner }, {})

    await Event.updateOrCreate({
      type: event.event,
      transactionHash: event.transactionHash.toLowerCase(),
      blockNumber: event.blockNumber.toString(),
      logIndex: event.logIndex.toString(),
      contract: this.name,
      tokenId,
    }, {
      from: previousOwner,
      to: newOwner,
      timestamp: await getBlockTimestamp(event.blockNumber),
    });

    const model = this.model as unknown as LucidModel

    await model.updateOrCreate({
      tokenId,
    }, {
      owner: newOwner,
    })
    const instance: TokenModel|null = (await model.find(tokenId)) as TokenModel|null
    instance?.syncOwnerFromLastEvent()
  }
}
