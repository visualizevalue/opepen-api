import Replicate from 'replicate'
import Env from '@ioc:Adonis/Core/Env'

export default new Replicate({
  auth: Env.get('REPLICATE_API_TOKEN'),
})
