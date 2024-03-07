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
| new BadRequest('message')
|
*/
export default class BadRequest extends Exception {
  constructor(
    message = `The request can not be processed.`,
    status = 400,
    code = 'BAD_REQUEST',
  ) {
    super(message, status, code)
  }
}
