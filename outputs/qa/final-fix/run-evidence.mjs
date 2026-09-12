import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const [file, command, ...args] = process.argv.slice(2)
const startedAt = new Date().toISOString()
const child = spawn(command, args, {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})
let stdout = '',
  stderr = ''
child.stdout.on('data', (data) => {
  stdout += data
  process.stdout.write(data)
})
child.stderr.on('data', (data) => {
  stderr += data
  process.stderr.write(data)
})
child.on('close', (exitCode) => {
  writeFileSync(
    file,
    JSON.stringify(
      {
        command,
        args,
        cwd: process.cwd(),
        startedAt,
        endedAt: new Date().toISOString(),
        exitCode,
        stdout,
        stderr,
      },
      null,
      2,
    ) + '\n',
  )
  process.exitCode = exitCode ?? 1
})
