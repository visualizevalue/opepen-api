import { ethers } from 'ethers'
import Env from '@ioc:Adonis/Core/Env'

export const MAX_BLOCK_QUERY = 2000

export default new ethers.providers.StaticJsonRpcProvider(Env.get('RPC_PROVIDER'))
