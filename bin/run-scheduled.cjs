const { spawnSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const env = JSON.parse(readFileSync('/run/opepen-cron-env.json', 'utf8'))
const result = spawnSync(process.execPath, ['ace', ...process.argv.slice(2)], {
  cwd: '/app', env, stdio: 'inherit',
})
if (result.error) console.error(result.error)
process.exit(result.status ?? 1)
