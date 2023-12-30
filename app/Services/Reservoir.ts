import api from 'api'
import Env from '@ioc:Adonis/Core/Env'

// @ts-ignore
const sdk = api('@reservoirprotocol/v3.0#1gqwn35lqqybx85')
sdk.auth(Env.get('RESERVOIR_KEY'))

export default sdk
