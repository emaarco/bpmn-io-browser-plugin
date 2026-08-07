import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'
import 'dmn-js/dist/assets/dmn-js-shared.css'
import 'dmn-js/dist/assets/dmn-js-drd.css'
import 'dmn-js/dist/assets/dmn-js-decision-table.css'
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css'
import 'dmn-js/dist/assets/dmn-js-literal-expression.css'
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css'
import './viewer.css'

import { h } from '../../src/dom'
import { errorMessage } from '../../src/util/errorMessage'
import { detectKind } from '../../src/kinds/registry'
import type { DiagramViewer } from '../../src/kinds/types'

// A hidden, standalone diagram viewer page (chrome-extension://<id>/viewer.html).
// It is NOT surfaced as a toolbar popup — the extension's job is the inline view
// on GitLab/GitHub. This page exists as a utility + the e2e render harness.

const app = document.querySelector<HTMLElement>('#app')!

const fileInput = h('input', { type: 'file', accept: '.bpmn,.dmn,.xml', style: 'display:none' })
const openBtn = h('button', { class: 'btn', type: 'button', text: 'Open file…' })
const toolbar = h('div', { class: 'toolbar' }, [
  h('strong', { text: 'BPMN / DMN Viewer' }),
  h('span', { class: 'spacer' }),
  openBtn,
  fileInput,
])

const canvas = h('div', { class: 'canvas' })
const dropzone = h('div', { class: 'dropzone' }, [
  h('span', { text: 'Drop a .bpmn or .dmn file here, or use “Open file…”.' }),
])
const stage = h('div', { class: 'stage' }, [canvas, dropzone])

app.append(toolbar, stage)

let viewer: DiagramViewer | null = null

function showError(text: string): void {
  dropzone.classList.remove('hidden', 'dragover')
  dropzone.replaceChildren(h('span', { class: 'error', text }))
}

async function openFile(file: File): Promise<void> {
  const kind = detectKind(file.name)
  if (!kind) {
    showError(`Unsupported file: ${file.name} (expected .bpmn or .dmn).`)
    return
  }
  const xml = await file.text()
  viewer?.destroy()
  viewer = null
  canvas.replaceChildren()
  try {
    viewer = await kind.createViewer(canvas, xml)
    dropzone.classList.add('hidden')
  } catch (err) {
    showError(`Could not render ${kind.label}: ${errorMessage(err)}`)
  }
}

openBtn.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0]
  if (file) void openFile(file)
})

dropzone.addEventListener('dragover', (event) => {
  event.preventDefault()
  dropzone.classList.add('dragover')
})
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'))
stage.addEventListener('drop', (event) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (file) void openFile(file)
})
stage.addEventListener('dragover', (event) => event.preventDefault())
