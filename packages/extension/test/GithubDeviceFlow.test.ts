import { DeviceFlowError } from '../src/git-hosts/github/DeviceFlowError'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GithubDeviceFlow, type DeviceCode } from '../src/git-hosts/github/GithubDeviceFlow'

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response
}

function flowAnswering(...bodies: unknown[]) {
  const fetch = vi.fn()
  for (const body of bodies) fetch.mockResolvedValueOnce(jsonResponse(body))
  return { fetch, flow: new GithubDeviceFlow(fetch) }
}

const code: DeviceCode = {
  deviceCode: 'dc-123',
  userCode: 'ABCD-1234',
  verificationUri: 'https://github.com/login/device',
  interval: 0,
  expiresIn: 900,
}

afterEach(() => {
  vi.useRealTimers()
})

describe('GithubDeviceFlow.requestDeviceCode', () => {
  it('maps GitHub snake_case into the DeviceCode shape', async () => {
    const { flow } = flowAnswering({
      device_code: 'dc-123',
      user_code: 'ABCD-1234',
      verification_uri: 'https://github.com/login/device',
      interval: 5,
      expires_in: 900,
    })
    await expect(flow.requestDeviceCode()).resolves.toEqual({ ...code, interval: 5 })
  })

  it('throws a DeviceFlowError when GitHub returns no device code', async () => {
    const { flow } = flowAnswering({ error: 'bad', error_description: 'nope' })
    await expect(flow.requestDeviceCode()).rejects.toBeInstanceOf(DeviceFlowError)
  })
})

describe('GithubDeviceFlow.pollForToken', () => {
  it('keeps polling while pending, then returns the access token', async () => {
    const { fetch, flow } = flowAnswering(
      { error: 'authorization_pending' },
      { access_token: 'gho_abc' },
    )
    await expect(flow.pollForToken(code)).resolves.toBe('gho_abc')
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('backs off on slow_down and still succeeds', async () => {
    vi.useFakeTimers()
    const { flow } = flowAnswering({ error: 'slow_down' }, { access_token: 'gho_xyz' })
    const token = flow.pollForToken(code)
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(token).resolves.toBe('gho_xyz')
  })

  it('throws when the code expires', async () => {
    const { flow } = flowAnswering({ error: 'expired_token' })
    await expect(flow.pollForToken(code)).rejects.toBeInstanceOf(DeviceFlowError)
  })

  it('throws when authorisation is denied', async () => {
    const { flow } = flowAnswering({ error: 'access_denied' })
    await expect(flow.pollForToken(code)).rejects.toBeInstanceOf(DeviceFlowError)
  })
})

describe('GithubDeviceFlow.fetchViewerLogin', () => {
  it('returns the login on success', async () => {
    const { flow } = flowAnswering({ login: 'octocat' })
    await expect(flow.fetchViewerLogin('gho_abc')).resolves.toBe('octocat')
  })

  it('returns an empty string when the request fails', async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({}, false))
    await expect(new GithubDeviceFlow(fetch).fetchViewerLogin('gho_abc')).resolves.toBe('')
  })
})
