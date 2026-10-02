import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { createMockBackend } from './backend'

const API_PREFIX = '/api'

type ParsedBody = { readonly ok: true; readonly body: unknown } | { readonly ok: false }

async function readJsonBody(req: IncomingMessage): Promise<ParsedBody> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk as Uint8Array))
  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw === '') return { ok: true, body: undefined }
  try {
    return { ok: true, body: JSON.parse(raw) as unknown }
  } catch {
    return { ok: false }
  }
}

function send(res: ServerResponse, status: number, body?: unknown): void {
  res.statusCode = status
  if (body === undefined) {
    res.end()
    return
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/** Serves a fake backend under /api so `npm run dev`, `preview` and the e2e tests need no real server. */
export function mockApiPlugin(): Plugin {
  const backend = createMockBackend()

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    const parsed = await readJsonBody(req)
    if (!parsed.ok) {
      send(res, 400, { message: 'Request body is not valid JSON' })
      return
    }
    const response = backend.handle({
      method: req.method ?? 'GET',
      path: pathname.slice(API_PREFIX.length),
      body: parsed.body,
    })
    send(res, response.status, response.body)
  }

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith(`${API_PREFIX}/`)) {
      next()
      return
    }
    void handle(req, res)
  }

  return {
    name: 'mock-api',
    apply: (_config, { mode }) => mode !== 'test',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
