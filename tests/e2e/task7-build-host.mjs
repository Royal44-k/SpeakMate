// QA-only host of an immutable, complete Next build/public snapshot. No routes
// are replaced, no learner stores are touched, no product config is changed.
import { createServer } from 'node:http'
import { readFile, realpath } from 'node:fs/promises'
import { resolve, relative, isAbsolute } from 'node:path'
import next from 'next'

const allowed = await realpath('.superpowers/sdd/2026-09-09-speakmate-3/qa')
const dir = await realpath(process.argv[2])
const rel = relative(allowed, dir)
if (!rel || rel.startsWith('..') || isAbsolute(rel))
  throw new Error(
    'Snapshot must be an explicit child of the Task7 QA directory',
  )
const port = Number(process.argv[3])
if (port !== 3133)
  throw new Error('Only the isolated old-build port3133 is allowed')
const buildId = (await readFile(resolve(dir, '.next/BUILD_ID'), 'utf8')).trim()
const required = JSON.parse(
  await readFile(resolve(dir, '.next/required-server-files.json'), 'utf8'),
)
const app = next({
  dir,
  dev: false,
  conf: { ...required.config, distDir: '.next' },
  hostname: '127.0.0.1',
  port,
})
await app.prepare()
const handle = app.getRequestHandler()
const server = createServer((request, response) => handle(request, response))
server.listen(port, '127.0.0.1', () =>
  console.log(JSON.stringify({ port, buildId, dir })),
)
process.on('SIGTERM', () =>
  server.close(() => app.close().then(() => process.exit(0))),
)
