import { http } from 'viem'
import { DelegateV2, type V1Delegation, type V2Delegation } from '@delegatexyz/sdk'
import Env from '@ioc:Adonis/Core/Env'

const filterApplicable = (d: V1Delegation|V2Delegation) => d.type === 'ALL' || (
  ['CONTRACT', 'ERC721'].includes(d.type) &&
  d.contract?.toLowerCase() === Env.get('OPEPEN_ADDRESS')
)

export const useDelegation = async (address: `0x${string}`) => {
  let addresses: string[] = []
  let tokenIds: number[] = []

  const v2 = new DelegateV2({ userTransport: http(Env.get('RPC_PROVIDER')) })

  const update = async () => {
    if (! address) {
      console.debug(`Abort fetching delegation for null address`)
      return
    }

    const incoming = await v2.getIncomingDelegations(address)
    const applicable = incoming.filter(filterApplicable)

    addresses = Array.from(new Set(
      applicable.map(d => d.from.toLowerCase())
    ))

    tokenIds = Array.from(new Set(
      applicable.filter(d => d.type === 'ERC721').map(d => d.tokenId)
    ))
  }

  await update()

  return {
    addresses,
    tokenIds,
    update,
  }
}
