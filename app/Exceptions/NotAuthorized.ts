import { Exception } from '@adonisjs/core/build/standalone'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| @example
| new NotAuthorized()
|
*/
export default class NotAuthorized extends Exception {
  constructor(message = `Forbidden.`, status = 403, code = 'NOT_AUTHORIZED') {
    super(message, status, code)
  }
}
