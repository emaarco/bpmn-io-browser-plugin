/**
 * Message contract between content scripts and the background service worker.
 *
 * All network requests are routed through the background worker: with
 * host_permissions it bypasses page CORS (needed for raw.githubusercontent.com)
 * and sends the user's cookies, so private repositories work too.
 */

export interface FetchTextRequest {
  type: 'fetchText'
  url: string
}

export type BackgroundRequest = FetchTextRequest

export type FetchTextResponse =
  { ok: true; text: string } | { ok: false; error: string; status?: number }
