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
| new InvalidInput('message')
|
*/
export default class InvalidInput extends Exception {
  constructor(
    message = `The input value can not be processed.`,
    status = 422,
    code = 'INVALID_INPUT',
  ) {
    super(message, status, code)
  }
}
