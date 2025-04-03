import { ethers, Event } from 'ethers'
import Logger from '@ioc:Adonis/Core/Logger'
import provider, { MAX_BLOCK_QUERY } from '../Services/RPCProvider'
import { delay, BLOCKS_PER_WEEK } from 'App/Helpers/time'

export default abstract class Contract {
  protected contract: ethers.Contract

  public async syncEvents(
    startBlock: number,
    eventType: string,
    onEvent: Function,
  ): Promise<ethers.BigNumber> {
    const lastSynched = ethers.BigNumber.from(startBlock)
    let latestBlock
    try {
      latestBlock = ethers.BigNumber.from(await provider.getBlockNumber())
    } catch (e) {
      Logger.error(e)
      Logger.warn(`Waiting 5 seconds and trying again`)
      await delay(5_000)
      return this.syncEvents(startBlock, eventType, onEvent)
    }

    const toBlock: ethers.BigNumber = latestBlock.gt(lastSynched.add(BLOCKS_PER_WEEK))
      ? lastSynched.add(BLOCKS_PER_WEEK)
      : latestBlock

    const fromBlockTag = lastSynched.toHexString()
    const toBlockTag = toBlock.eq(latestBlock) ? 'latest' : toBlock.toHexString()

    // Store events
    const [events, until] = await this.fetchEvents(fromBlockTag, toBlockTag, eventType)
    for (const event of events) {
      await onEvent.call(this, event)
    }

    const syncedUntil = until.gt(0) && until.lt(toBlock) ? until : toBlock
    Logger.info(
      `Synched ${eventType} events to block ${syncedUntil?.toNumber() || 'latest'}; Found ${events.length} events.`,
    )

    // If we're not fully synched up, continue synching
    if (toBlockTag !== 'latest') {
      return await this.syncEvents(syncedUntil.toNumber(), eventType, onEvent)
    }

    return syncedUntil
  }

  protected async fetchEvents(
    fromBlockTag,
    toBlockTag,
    eventType,
  ): Promise<[Event[], ethers.BigNumber]> {
    let events: Event[] = []
    let until: ethers.BigNumber = ethers.BigNumber.from(0)
    try {
      events = await this.contract.queryFilter(eventType, fromBlockTag, toBlockTag)
    } catch (e) {
      try {
        // Try the max of 2000 blocks
        until = ethers.BigNumber.from(fromBlockTag).add(MAX_BLOCK_QUERY)
        Logger.info(`Failed on ${toBlockTag}; Trying 2000 blocks until ${until.toString()}`)
        events = await this.contract.queryFilter(eventType, fromBlockTag, until.toHexString())
      } catch (e) {
        Logger.error(e)
      }
    }
    return [events, until]
  }

  public ownerOf(tokenId: number): Promise<string> {
    return this.contract.ownerOf(tokenId)
  }
}
