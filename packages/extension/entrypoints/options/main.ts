import './options.css'

import { browser } from 'wxt/browser'
import { h } from '../../src/dom'
import { errorMessage } from '../../src/util/errorMessage'
import { normalizeOrigin } from '../../src/hosts/origin'
import {
  addHost,
  getSavedHosts,
  removeHost,
  type HostType,
  type SelfHostedHost,
} from '../../src/hosts/storage'
import { registerHost, unregisterHost } from '../../src/hosts/registration'
import {
  getGithubLogin,
  getGithubToken,
  setGithubLogin,
  setGithubToken,
} from '../../src/net/githubTokenStore'
import {
  DeviceFlowError,
  GITHUB_APP_INSTALL_URL,
  fetchViewerLogin,
  pollForToken,
  requestDeviceCode,
  type DeviceCode,
} from '../../src/net/githubAuth'

const app = document.querySelector<HTMLElement>('#app')!

const originInput = h('input', {
  type: 'text',
  class: 'input origin',
  placeholder: 'https://gitlab.example.com',
}) as HTMLInputElement
const typeSelect = h('select', { class: 'input' }, [
  h('option', { value: 'gitlab', text: 'GitLab' }),
  h('option', { value: 'github', text: 'GitHub' }),
]) as HTMLSelectElement
const addButton = h('button', { class: 'btn primary', type: 'button', text: 'Add instance' })
const status = h('p', { class: 'status' })
const list = h('ul', { class: 'list' })

app.append(
  h('h1', { text: 'Self-hosted instances' }),
  h('p', {
    class: 'intro',
    text: 'gitlab.com and github.com work out of the box. For a self-hosted GitLab or GitHub Enterprise instance, the quickest way is to open a .bpmn file (or a merge request) there and click the extension icon — or right-click the page and choose "Enable bpmn-io-browser-plugin on this domain". You can also add a domain manually below.',
  }),
  h('div', { class: 'card' }, [
    h('div', { class: 'row' }, [originInput, typeSelect, addButton]),
    status,
  ]),
  h('div', { class: 'card' }, [list]),
)

addButton.addEventListener('click', () => void onAdd())
originInput.addEventListener('keydown', (event) => {
  if ((event as KeyboardEvent).key === 'Enter') void onAdd()
})

// --- GitHub access for private repos (GitHub App, device flow) ----------------

const githubAuthBody = h('div', { class: 'auth-body' })
const githubAuthStatus = h('p', { class: 'status' })

app.append(
  h('h1', { text: 'GitHub access (private repos)' }),
  h('p', { class: 'intro' }, [
    document.createTextNode(
      'Only needed for private repositories on github.com — their diff metadata comes from ',
    ),
    h('code', { text: 'api.github.com' }),
    document.createTextNode(
      ', a separate origin your github.com login cookie does not cover (public repos, GitLab and GitHub Enterprise work without it).',
    ),
  ]),
  h('p', { class: 'intro' }, [
    document.createTextNode('First '),
    h('a', {
      href: GITHUB_APP_INSTALL_URL,
      target: '_blank',
      rel: 'noreferrer',
      text: 'install the GitHub App',
    }),
    document.createTextNode(
      ' on the accounts and repositories it may read, then connect below. The extension only ever gets access to the repos you install it on, and the token is stored in this browser and sent only to ',
    ),
    h('code', { text: 'api.github.com' }),
    document.createTextNode('.'),
  ]),
  h('div', { class: 'card' }, [githubAuthBody, githubAuthStatus]),
)

void renderGithubAuth()
void refresh()

async function onAdd(): Promise<void> {
  const origin = normalizeOrigin(originInput.value)
  if (!origin) return setStatus('Enter a valid http(s) URL.', 'error')

  const type = typeSelect.value as HostType
  let granted: boolean
  try {
    granted = await browser.permissions.request({ origins: [`${origin}/*`] })
  } catch (err) {
    return setStatus(`Could not request permission: ${errorMessage(err)}`, 'error')
  }
  if (!granted) return setStatus('Permission was not granted.', 'error')

  await addHost({ origin, type })
  try {
    await registerHost({ origin, type })
  } catch (err) {
    return setStatus(`Saved, but registration failed: ${errorMessage(err)}`, 'error')
  }
  originInput.value = ''
  setStatus(`Added ${origin}.`, 'ok')
  await refresh()
}

async function onRemove(host: SelfHostedHost): Promise<void> {
  await unregisterHost(host)
  await removeHost(host.origin)
  await browser.permissions.remove({ origins: [`${host.origin}/*`] }).catch(() => undefined)
  setStatus(`Removed ${host.origin}.`, 'ok')
  await refresh()
}

async function refresh(): Promise<void> {
  const hosts = await getSavedHosts()
  if (!hosts.length) {
    list.replaceChildren(h('li', { class: 'empty', text: 'No self-hosted instances added yet.' }))
    return
  }
  list.replaceChildren(...hosts.map(renderRow))
}

function renderRow(host: SelfHostedHost): HTMLElement {
  const remove = h('button', { class: 'btn danger', type: 'button', text: 'Remove' })
  remove.addEventListener('click', () => void onRemove(host))
  return h('li', {}, [
    h('span', { class: 'origin-name', text: host.origin }),
    h('span', { class: 'badge', text: badgeLabel(host.type) }),
    remove,
  ])
}

function badgeLabel(type: HostType | undefined): string {
  if (type === 'gitlab') return 'GitLab'
  if (type === 'github') return 'GitHub'
  return 'Self-hosted'
}

function setStatus(text: string, kind: 'error' | 'ok'): void {
  status.textContent = text
  status.className = `status ${kind}`
}

/** Draw the connect/disconnect card from the currently stored token. */
async function renderGithubAuth(): Promise<void> {
  const [token, login] = await Promise.all([getGithubToken(), getGithubLogin()])
  if (token) {
    const disconnect = h('button', { class: 'btn danger', type: 'button', text: 'Disconnect' })
    disconnect.addEventListener('click', () => void onDisconnect())
    githubAuthBody.replaceChildren(
      h('div', { class: 'row auth-row' }, [
        h('span', { class: 'auth-connected', text: login ? `Connected as @${login}` : 'Connected' }),
        disconnect,
      ]),
    )
    return
  }
  const connect = h('button', { class: 'btn primary', type: 'button', text: 'Connect GitHub' })
  connect.addEventListener('click', () => void onConnect())
  githubAuthBody.replaceChildren(h('div', { class: 'row auth-row' }, [connect]))
}

/** Run the device flow end to end: show the code, wait for the user, store the token. */
async function onConnect(): Promise<void> {
  let code: DeviceCode
  try {
    code = await requestDeviceCode()
  } catch (err) {
    return setGithubAuthStatus(`Could not start authorisation: ${authError(err)}`, 'error')
  }

  showUserCode(code)
  setGithubAuthStatus('Waiting for you to authorise the code on github.com…', 'ok')
  await browser.tabs.create({ url: code.verificationUri }).catch(() => undefined)

  try {
    const token = await pollForToken(code)
    await setGithubToken(token)
    await setGithubLogin(await fetchViewerLogin(token))
    setGithubAuthStatus('Connected.', 'ok')
  } catch (err) {
    setGithubAuthStatus(authError(err), 'error')
  }
  await renderGithubAuth()
}

async function onDisconnect(): Promise<void> {
  await setGithubToken('')
  await setGithubLogin('')
  setGithubAuthStatus('Disconnected.', 'ok')
  await renderGithubAuth()
}

/** Show the one-time user code prominently while the flow is in progress. */
function showUserCode(code: DeviceCode): void {
  const copyButton = h('button', {
    class: 'btn copy',
    type: 'button',
    text: 'Copy',
    title: 'Copy the code to your clipboard',
    onClick: () => copyUserCode(code.userCode, copyButton),
  })
  githubAuthBody.replaceChildren(
    h('p', { class: 'auth-hint' }, [
      document.createTextNode('Enter this code at '),
      h('a', {
        href: code.verificationUri,
        target: '_blank',
        rel: 'noreferrer',
        text: 'github.com/login/device',
      }),
      document.createTextNode(' (a new tab should open automatically):'),
    ]),
    h('div', { class: 'user-code-row' }, [
      h('div', { class: 'user-code', text: code.userCode }),
      copyButton,
    ]),
  )
}

/** Copy the code to the clipboard and give brief visual feedback on the button. */
async function copyUserCode(userCode: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(userCode)
  } catch {
    // Clipboard may be blocked (permissions/insecure context); the code stays selectable.
    return
  }
  const original = button.textContent
  button.textContent = 'Copied ✓'
  button.classList.add('copied')
  window.setTimeout(() => {
    button.textContent = original
    button.classList.remove('copied')
  }, 1500)
}

function setGithubAuthStatus(text: string, kind: 'error' | 'ok'): void {
  githubAuthStatus.textContent = text
  githubAuthStatus.className = `status ${kind}`
}

/** Device-flow errors already carry a user-facing message; fall back for the rest. */
function authError(err: unknown): string {
  return err instanceof DeviceFlowError ? err.message : errorMessage(err)
}
