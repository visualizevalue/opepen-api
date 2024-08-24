import { ethers } from 'ethers'
import provider from './RPCProvider'

const PRICE_FEED_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export type EthPrice = {
  BTC: number; // "BTC": 0.0435,
  USD: number; // "USD": 2794.92,
  EUR: number; // "EUR": 2495.48
}

export class PriceOracle {
  protected contract: ethers.Contract = new ethers.Contract(PRICE_FEED_ADDRESS, CHAINLINK_PRICE_FEED_ABI, provider)
  private ethUSDRaw: bigint
  public ethPrice: EthPrice


  public async update (): Promise<void> {
    try {
      this.ethUSDRaw = (await this.contract.latestRoundData()).answer

      this.ethPrice = {
        BTC: 0,
        USD: Number(BigInt(this.ethUSDRaw) / BigInt(1e8)),
        EUR: 0,
      }
    } catch (e) {
    }
  }

}

const priceOracle = new PriceOracle()

export default priceOracle
