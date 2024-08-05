import { constants, ethers } from 'ethers'
import Env from '@ioc:Adonis/Core/Env'
import abi from './abis/BurnedOpepen.json'
import provider, { getBlockTimestamp } from '../Services/RPCProvider'
import Contract from './Contract'
import Account from 'App/Models/Account'
import Event from 'App/Models/Event'
import BurnedOpepenModel from 'App/Models/BurnedOpepen'
import BotNotifications from 'App/Services/BotNotifications'
import { delay } from 'App/Helpers/time'
import Opepen from 'App/Models/Opepen'
import { ContractType } from 'App/Models/types'

const EVENTS = ['Burn', 'Transfer']

export default class BurnedOpepen extends Contract {
  public address: string
  public name: ContractType = 'BURNED_OPEPEN'
  public startBlock: number
  public interval: number

  constructor (address: string, startBlock: number, interval: number = 13_000) {
    super()
    this.address = address
    this.startBlock = startBlock
    this.interval = interval
  }

  public static async initialize (): Promise<BurnedOpepen> {
    const instance = new BurnedOpepen(Env.get('BURNED_OPEPEN_ADDRESS'), Env.get('BURNED_OPEPEN_START_BLOCK'), 12_000)
    instance.contract = await new ethers.Contract(Env.get('BURNED_OPEPEN_ADDRESS'), Array.from(abi), provider)

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

  protected async onBurn (event: ethers.Event) {
    if (! event.args) {
      console.log(`Error: no args in event`)
      return
    }

    const opepenId = event.args.opepenId.toString()
    const burnedId = event.args.burnedId.toString()
    const burner   = event.args.burner.toLowerCase()

    await Account.updateOrCreate({ address: burner }, {})

    await Event.updateOrCreate({
      type: event.event,
      transactionHash: event.transactionHash.toLowerCase(),
      blockNumber: event.blockNumber.toString(),
      logIndex: event.logIndex.toString(),
      contract: this.name,
    }, {
      from: burner,
      to: constants.AddressZero,
      tokenId: opepenId,
      timestamp: await getBlockTimestamp(event.blockNumber),
      data: { burnedId }
    });

    const metadataURI = await this.contract.tokenURI(burnedId)
    const metadataJSON = Buffer.from(metadataURI.substring(29), `base64`).toString()
    const metadata = JSON.parse(metadataJSON)

    const burnedOpepen = await BurnedOpepenModel.updateOrCreate({
      tokenId: burnedId,
    }, {
      tokenId: burnedId,
      owner: burner,
      data: {
        name: metadata.name,
        image: metadata.image,
      },
      burnedAt: await getBlockTimestamp(event.blockNumber),
    })
    await burnedOpepen.save()

    const opepen = await Opepen.find(opepenId)
    if (opepen) {
      opepen.burnedOpepenId = burnedId
      await opepen?.save()
    }

    await burnedOpepen.updateImage()

    await BotNotifications.burn(burnedOpepen)
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

    await BurnedOpepenModel.updateOrCreate({
      tokenId,
    }, {
      owner: newOwner,
    })
  }
}
