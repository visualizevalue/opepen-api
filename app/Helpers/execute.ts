import { exec as cbExec, execFile as cbExecFile } from 'child_process'
import { promisify } from 'util'

export const execute = promisify(cbExec)
export const executeFile = promisify(cbExecFile)
