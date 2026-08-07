import { test, expect } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Smoke-tests the built standalone viewer page (viewer.html). That page uses no
 * extension APIs, so we serve the production build over HTTP and drive it in a
 * plain **headless** browser — no `--load-extension`, no headed context, no
 * xvfb, no MV3 service-worker teardown to hang on. Far more robust in CI than
 * loading the unpacked extension, and it still exercises the real bundled
 * bpmn-js / dmn-js render path.
 *
 * Build the extension first: `npm run build -w @git-diagram-viewer/extension`.
 */

const dir = dirname(fileURLToPath(import.meta.url))
const outDir = normalize(join(dir, '..', '.output', 'chrome-mv3'))
const fixtures = join(dir, 'fixtures')

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.eot': 'application/vnd.ms-fontobject',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
}

let server: Server
let baseURL: string

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
    const target = normalize(join(outDir, rel))
    if (!target.startsWith(outDir)) {
      res.writeHead(403)
      res.end('forbidden')
      return
    }
    try {
      const body = readFileSync(target)
      res.writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('not found')
    }
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0
  baseURL = `http://localhost:${port}`
})

test.afterAll(() => {
  server?.close()
})

async function expectRenders(
  page: import('@playwright/test').Page,
  fixture: string,
): Promise<void> {
  await page.goto(`${baseURL}/viewer.html`, { waitUntil: 'domcontentloaded' })
  await page.setInputFiles('input[type=file]', join(fixtures, fixture))
  // bpmn-js / dmn-js mount an <svg> canvas and render diagram-js shape elements.
  await expect(page.locator('.canvas svg').first()).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.djs-element').first()).toBeVisible()
}

test('standalone viewer renders a .bpmn file with bpmn-js', async ({ page }) => {
  await expectRenders(page, 'sample.bpmn')
})

test('standalone viewer renders a .dmn file with dmn-js', async ({ page }) => {
  await expectRenders(page, 'sample.dmn')
})
