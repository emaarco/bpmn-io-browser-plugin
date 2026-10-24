import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { browser } from 'wxt/browser'
import { disableRevokedHosts, enableGrantedHosts } from '../src/hosts/permissions'
import { registerHost, unregisterHost } from '../src/hosts/registration'
import { addHost, getSavedHosts, removeHost } from '../src/hosts/storage'

vi.mock('wxt/browser', () => ({
  browser: { tabs: { query: vi.fn(), reload: vi.fn() } },
}))
vi.mock('../src/hosts/registration', () => ({ registerHost: vi.fn(), unregisterHost: vi.fn() }))
vi.mock('../src/hosts/storage', () => ({
  addHost: vi.fn(),
  getSavedHosts: vi.fn(),
  removeHost: vi.fn(),
}))

const origin = 'https://gitlab.example.com'
const queryTabs = browser.tabs.query as unknown as Mock<
  () => Promise<{ id: number; url: string }[]>
>

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getSavedHosts).mockResolvedValue([])
  queryTabs.mockResolvedValue([])
  vi.mocked(browser.tabs.reload).mockResolvedValue(undefined)
  vi.mocked(unregisterHost).mockResolvedValue(undefined)
})

describe('enableGrantedHosts', () => {
  it('saves and registers a granted origin, then reloads only its supported tabs', async () => {
    queryTabs.mockResolvedValue([
      { id: 1, url: `${origin}/group/project/-/merge_requests/7` },
      { id: 2, url: `${origin}/explore` },
    ])

    await enableGrantedHosts([`${origin}/*`])

    expect(addHost).toHaveBeenCalledWith({ origin })
    expect(registerHost).toHaveBeenCalledWith({ origin })
    expect(browser.tabs.reload).toHaveBeenCalledTimes(1)
    expect(browser.tabs.reload).toHaveBeenCalledWith(1)
  })

  it('keeps the saved host type when re-granted', async () => {
    vi.mocked(getSavedHosts).mockResolvedValue([{ origin, type: 'gitlab' }])

    await enableGrantedHosts([`${origin}/*`])

    expect(addHost).toHaveBeenCalledWith({ origin, type: 'gitlab' })
  })

  it('ignores patterns that are not a concrete origin', async () => {
    await enableGrantedHosts(['<all_urls>'])

    expect(addHost).not.toHaveBeenCalled()
  })

  it('does not reload tabs when registration fails', async () => {
    vi.mocked(registerHost).mockRejectedValue(new Error('boom'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await enableGrantedHosts([`${origin}/*`])

    expect(queryTabs).not.toHaveBeenCalled()
  })
})

describe('disableRevokedHosts', () => {
  it('unregisters and forgets a revoked origin', async () => {
    await disableRevokedHosts([`${origin}/*`])

    expect(unregisterHost).toHaveBeenCalledWith({ origin })
    expect(removeHost).toHaveBeenCalledWith(origin)
  })
})
