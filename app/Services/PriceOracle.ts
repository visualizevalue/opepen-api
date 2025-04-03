import { ethers } from 'ethers'
import provider from './RPCProvider'

const PRICE_FEED_ADDRESSES = {
  'ETH/USD': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  'BTC/USD': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  'ETH/EUR': '0xb49f677943BC038e9857d61E7d053CaA2C1734C1',
}

const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export type EthPrice = {
  BTC: number // "BTC": 0.0435,
  USD: number // "USD": 2794.92,
  EUR: number // "EUR": 2495.48
}

export class PriceOracle {
  protected ethUSDContract: ethers.Contract = new ethers.Contract(
    PRICE_FEED_ADDRESSES['ETH/USD'],
    CHAINLINK_PRICE_FEED_ABI,
    provider,
  )
  protected btcUSDContract: ethers.Contract = new ethers.Contract(
    PRICE_FEED_ADDRESSES['BTC/USD'],
    CHAINLINK_PRICE_FEED_ABI,
    provider,
  )
  protected ethEURContract: ethers.Contract = new ethers.Contract(
    PRICE_FEED_ADDRESSES['ETH/EUR'],
    CHAINLINK_PRICE_FEED_ABI,
    provider,
  )

  private ethUSDRaw: bigint
  public ethPrice: EthPrice

  public async update(): Promise<void> {
    try {
      this.ethUSDRaw = (await this.ethUSDContract.latestRoundData()).answer

      this.ethPrice = {
        BTC: 0,
        USD: Number(BigInt(this.ethUSDRaw) / BigInt(1e8)),
        EUR: 0,
      }
    } catch (e) {}
  }
}

const priceOracle = new PriceOracle()

export default priceOracle
