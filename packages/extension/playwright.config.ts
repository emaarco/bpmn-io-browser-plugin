import { defineConfig } from '@playwright/test'

/**
 * E2E serves the built standalone page from .output/chrome-mv3 over HTTP (the
 * spec spins up a tiny static server) and drives it in headless Chromium — no
 * unpacked extension, no headed context. Build the extension first:
 * `npm run build -w @bpmn-io-browser-plugin/extension`.
 */
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    trace: 'on-first-retry',
  },
})
