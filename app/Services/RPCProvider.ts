import { ethers } from 'ethers'
import { DateTime } from 'luxon'
import Env from '@ioc:Adonis/Core/Env'

export const MAX_BLOCK_QUERY = 2000

const provider = new ethers.providers.StaticJsonRpcProvider(Env.get('RPC_PROVIDER'))

const BLOCK_CACHE = {}

export const getBlockTimestamp = async (block) => {
  if (BLOCK_CACHE[block]) return DateTime.fromSeconds(BLOCK_CACHE[block])

  const timestamp = (await provider.getBlock(block)).timestamp

  BLOCK_CACHE[block] = timestamp

  return DateTime.fromSeconds(timestamp)
}

export default provider
