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
import { getGithubToken, setGithubToken } from '../../src/net/githubToken'

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

// --- GitHub API token (private repos on github.com) ---------------------------

const tokenInput = h('input', {
  type: 'password',
  class: 'input token',
  placeholder: 'ghp_… or github_pat_… (leave empty to remove)',
  autocomplete: 'off',
  spellcheck: 'false',
}) as HTMLInputElement
const tokenSaveButton = h('button', { class: 'btn primary', type: 'button', text: 'Save token' })
const tokenStatus = h('p', { class: 'status' })

app.append(
  h('h1', { text: 'GitHub API token' }),
  h('p', { class: 'intro' }, [
    document.createTextNode(
      'Only needed for private repositories on github.com — their diff metadata comes from ',
    ),
    h('code', { text: 'api.github.com' }),
    document.createTextNode(
      ', a separate origin your github.com login cookie does not cover (public repos, GitLab and GitHub Enterprise work without it). A token also lifts the 60-requests/hour anonymous rate limit.',
    ),
  ]),
  h('p', { class: 'intro' }, [
    document.createTextNode('To cover '),
    h('strong', { text: 'every repo you can access' }),
    document.createTextNode(
      ' — your own and all your organisations — the simplest choice is a classic token with the ',
    ),
    h('strong', { text: 'repo' }),
    document.createTextNode(' scope, created at '),
    h('a', {
      href: 'https://github.com/settings/tokens/new?scopes=repo&description=bpmn-io-browser-plugin',
      target: '_blank',
      rel: 'noreferrer',
      text: 'github.com/settings/tokens',
    }),
    document.createTextNode(
      '. If an organisation uses SSO, click "Configure SSO" on the token afterwards and authorise it for that organisation, or its private repos stay invisible.',
    ),
  ]),
  h('p', { class: 'intro' }, [
    document.createTextNode('Prefer to limit access? A '),
    h('a', {
      href: 'https://github.com/settings/personal-access-tokens/new',
      target: '_blank',
      rel: 'noreferrer',
      text: 'fine-grained token',
    }),
    document.createTextNode(' with '),
    h('strong', { text: 'Contents: Read-only' }),
    document.createTextNode(' (add '),
    h('strong', { text: 'Pull requests: Read-only' }),
    document.createTextNode(
      ' for PRs) works too, but only for the single account or organisation you pick as its resource owner.',
    ),
  ]),
  h('p', { class: 'intro' }, [
    document.createTextNode('The token is stored only in this browser and sent only to '),
    h('code', { text: 'api.github.com' }),
    document.createTextNode('.'),
  ]),
  h('div', { class: 'card' }, [
    h('div', { class: 'row' }, [tokenInput, tokenSaveButton]),
    tokenStatus,
  ]),
)

tokenSaveButton.addEventListener('click', () => void onSaveToken())
tokenInput.addEventListener('keydown', (event) => {
  if ((event as KeyboardEvent).key === 'Enter') void onSaveToken()
})

void loadToken()
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

async function loadToken(): Promise<void> {
  tokenInput.value = await getGithubToken()
}

async function onSaveToken(): Promise<void> {
  try {
    await setGithubToken(tokenInput.value)
  } catch (err) {
    return setTokenStatus(`Could not save token: ${errorMessage(err)}`, 'error')
  }
  setTokenStatus(tokenInput.value.trim() ? 'Token saved.' : 'Token removed.', 'ok')
}

function setTokenStatus(text: string, kind: 'error' | 'ok'): void {
  tokenStatus.textContent = text
  tokenStatus.className = `status ${kind}`
}
