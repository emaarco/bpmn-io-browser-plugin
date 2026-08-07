/**
 * Normalise user input into a bare origin (`https://host[:port]`), defaulting to
 * https when no scheme is given. Returns null for anything that isn't a valid
 * http(s) URL. Pure — unit-tested without a browser.
 */
export function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  // Keep an explicit scheme (so a non-http(s) one is rejected below); otherwise
  // default to https for bare host input like `gitlab.example.com`.
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  const withProtocol = hasScheme ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProtocol)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}
