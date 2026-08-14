import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DeviceFlowError,
  fetchViewerLogin,
  pollForToken,
  requestDeviceCode,
  type DeviceCode,
} from '../src/net/githubAuth'

/** Build a minimal fetch Response stand-in that yields `body` from `.json()`. */
function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response
}

// interval: 0 keeps pollForToken's back-off wait effectively instant in tests.
const code: DeviceCode = {
  deviceCode: 'dc-123',
  userCode: 'ABCD-1234',
  verificationUri: 'https://github.com/login/device',
  interval: 0,
  expiresIn: 900,
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('requestDeviceCode', () => {
  it('maps GitHub snake_case into the DeviceCode shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          device_code: 'dc-123',
          user_code: 'ABCD-1234',
          verification_uri: 'https://github.com/login/device',
          interval: 5,
          expires_in: 900,
        }),
      ),
    )
    await expect(requestDeviceCode()).resolves.toEqual({ ...code, interval: 5 })
  })

  it('throws a DeviceFlowError when GitHub returns no device code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'bad', error_description: 'nope' })),
    )
    await expect(requestDeviceCode()).rejects.toBeInstanceOf(DeviceFlowError)
  })
})

describe('pollForToken', () => {
  it('keeps polling while pending, then returns the access token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: 'authorization_pending' }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'gho_abc' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(pollForToken(code)).resolves.toBe('gho_abc')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('backs off on slow_down and still succeeds', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ error: 'slow_down' }))
        .mockResolvedValueOnce(jsonResponse({ access_token: 'gho_xyz' })),
    )
    const promise = pollForToken(code)
    // slow_down adds a 5s back-off before the next poll — drive it with fake timers.
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(promise).resolves.toBe('gho_xyz')
  })

  it('throws when the code expires', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'expired_token' })))
    await expect(pollForToken(code)).rejects.toBeInstanceOf(DeviceFlowError)
  })

  it('throws when authorisation is denied', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'access_denied' })))
    await expect(pollForToken(code)).rejects.toBeInstanceOf(DeviceFlowError)
  })
})

describe('fetchViewerLogin', () => {
  it('returns the login on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ login: 'octocat' })))
    await expect(fetchViewerLogin('gho_abc')).resolves.toBe('octocat')
  })

  it('returns an empty string when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)))
    await expect(fetchViewerLogin('gho_abc')).resolves.toBe('')
  })
})
