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
