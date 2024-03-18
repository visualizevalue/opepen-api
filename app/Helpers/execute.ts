import { exec as cbExec } from 'child_process'
import { promisify } from 'util'

export const execute = promisify(cbExec)
