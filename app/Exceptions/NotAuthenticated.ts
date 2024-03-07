import { Exception } from '@adonisjs/core/build/standalone'

/*
|--------------------------------------------------------------------------
| Exception
|--------------------------------------------------------------------------
|
| The Exception class imported from `@adonisjs/core` allows defining
| a status code and error code for every exception.
|
| @example
| new NotAuthenticated()
|
*/
export default class NotAuthenticated extends Exception {
  constructor(
    message = `User must be authenticated.`,
    status = 401,
    code = 'NOT_AUTHENTICATED',
  ) {
    super(message, status, code)
  }
}
