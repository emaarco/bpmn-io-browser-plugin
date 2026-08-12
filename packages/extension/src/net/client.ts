/**
 * Content-script side of the network layer: ask the background worker to fetch a
 * URL and return its text (or throw with a readable message).
 */

import { browser } from 'wxt/browser'
import type { FetchTextRequest, FetchTextResponse } from './messages'

/** A failed fetch, carrying the HTTP status (when the request reached the server). */
export class FetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function fetchText(url: string): Promise<string> {
  const request: FetchTextRequest = { type: 'fetchText', url }
  const response = (await browser.runtime.sendMessage(request)) as FetchTextResponse | undefined
  if (!response) throw new Error('No response from background worker')
  if (!response.ok) throw new FetchError(response.error, response.status)
  return response.text
}

/** Fetch a URL and parse the response as JSON. */
export async function fetchJson<T = unknown>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T
}
