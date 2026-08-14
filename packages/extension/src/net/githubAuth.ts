/**
 * GitHub App **OAuth Device Flow** — the backendless way to obtain a
 * user-to-server access token for github.com's REST API (`api.github.com`)
 * without ever shipping a client secret.
 *
 * A browser extension cannot hold a GitHub App's private key (anyone could read
 * it), so it cannot mint installation tokens itself. The device flow sidesteps
 * that: the user installs the app on the repos they choose, authorises this
 * device with a short code, and GitHub hands back a user token scoped to the
 * intersection of *what the user can see* and *where the app is installed*. Only
 * the public `client_id` is needed — no secret.
 *
 * The resulting token is persisted via {@link ./githubTokenStore} and attached only to
 * `api.github.com`; see that module for the storage + guard.
 */

/**
 * Public client id of the GitHub App. Safe to ship — the device flow needs no
 * secret (github.com/apps/bpmn-io-browser-plugin).
 */
const GITHUB_APP_CLIENT_ID = 'Iv23liayyRyhjA7nIqfG'

/**
 * Where the user installs / manages which repositories the app may read. The
 * device-flow token can only reach repos the app is installed on, so the options
 * page links here.
 */
export const GITHUB_APP_INSTALL_URL =
  'https://github.com/apps/bpmn-io-browser-plugin/installations/new'

const DEVICE_CODE_URL = 'https://github.com/login/device/code'
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const DEVICE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'

/** The one-time code + polling parameters returned when a device flow starts. */
export interface DeviceCode {
  /** Opaque code this device polls the token endpoint with (never shown to the user). */
  deviceCode: string
  /** Short code the user types at {@link DeviceCode.verificationUri}. */
  userCode: string
  /** Page the user opens to enter {@link DeviceCode.userCode} (github.com/login/device). */
  verificationUri: string
  /** Minimum seconds between token-endpoint polls. */
  interval: number
  /** Seconds until {@link DeviceCode.userCode} expires. */
  expiresIn: number
}

/** A device-flow step failed (network, GitHub error, expiry or cancellation). */
export class DeviceFlowError extends Error {}

function readString(data: Record<string, unknown>, key: string): string {
  const value = data[key]
  return typeof value === 'string' ? value : ''
}

async function postForm(
  url: string,
  params: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(params).toString(),
  })
  if (!response.ok) throw new DeviceFlowError(`GitHub returned HTTP ${response.status}.`)
  return (await response.json()) as Record<string, unknown>
}

/** Start a device flow: ask GitHub for a user code + polling parameters. */
export async function requestDeviceCode(): Promise<DeviceCode> {
  const data = await postForm(DEVICE_CODE_URL, { client_id: GITHUB_APP_CLIENT_ID })
  const deviceCode = readString(data, 'device_code')
  const userCode = readString(data, 'user_code')
  const verificationUri = readString(data, 'verification_uri')
  if (!deviceCode || !userCode || !verificationUri) {
    throw new DeviceFlowError(
      readString(data, 'error_description') || 'GitHub did not return a device code.',
    )
  }
  const interval = typeof data.interval === 'number' ? data.interval : 5
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 900
  return { deviceCode, userCode, verificationUri, interval, expiresIn }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DeviceFlowError('Connecting was cancelled.'))
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DeviceFlowError('Connecting was cancelled.'))
      },
      { once: true },
    )
  })
}

/**
 * Poll the token endpoint until the user authorises the device (→ resolves with
 * the access token) or the code expires / is denied (→ throws). Honours GitHub's
 * `authorization_pending` (keep waiting) and `slow_down` (back off) signals. Pass
 * an {@link AbortSignal} to cancel a wait in progress.
 */
export async function pollForToken(code: DeviceCode, signal?: AbortSignal): Promise<string> {
  let intervalMs = code.interval * 1000
  const deadline = Date.now() + code.expiresIn * 1000
  while (Date.now() < deadline) {
    await delay(intervalMs, signal)
    const data = await postForm(ACCESS_TOKEN_URL, {
      client_id: GITHUB_APP_CLIENT_ID,
      device_code: code.deviceCode,
      grant_type: DEVICE_GRANT_TYPE,
    })
    const token = readString(data, 'access_token')
    if (token) return token
    switch (readString(data, 'error')) {
      case 'authorization_pending':
        break // user hasn't entered the code yet — keep polling
      case 'slow_down':
        intervalMs += 5000
        break
      case 'expired_token':
        throw new DeviceFlowError('The code expired before it was authorised. Please try again.')
      case 'access_denied':
        throw new DeviceFlowError('Authorisation was denied.')
      default:
        throw new DeviceFlowError(
          readString(data, 'error_description') || 'Could not complete the GitHub authorisation.',
        )
    }
  }
  throw new DeviceFlowError('The code expired before it was authorised. Please try again.')
}

/** Best-effort GitHub login of the authorising user, for a "Connected as @…" label. */
export async function fetchViewerLogin(token: string): Promise<string> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    })
    if (!response.ok) return ''
    const data = (await response.json()) as Record<string, unknown>
    return readString(data, 'login')
  } catch {
    return ''
  }
}
