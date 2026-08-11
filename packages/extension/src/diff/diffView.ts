/**
 * The inline merge-request BPMN panel, shown additively above the host's own
 * code diff (never replacing it). A single Plain / Diff switch:
 *
 *  - Plain — the current (head) model on its own, no markers. The default.
 *  - Diff  — two viewers side by side (before | after) with the semantic diff
 *            from @bpmn-io-browser-plugin/core marked up, plus prev/next/all navigation.
 *
 * Diagram colours follow the host's light/dark tokens. Ported from the "BPMN
 * Diff" userscript renderDiff/setupNav.
 */

import { diffBpmn, type BpmnDiff } from '@bpmn-io-browser-plugin/core'
import { h } from '../dom'
import { errorMessage } from '../util/errorMessage'
import { createThemedViewer } from '../viewer/createThemedViewer'
import { enableFocusZoom } from '../viewer/focusZoom'
import { toggleZoomScroll } from '../viewer/zoomScroll'
import { detectHostTheme } from '../theme'
import { fitWithPadding } from '../viewer/fitWithPadding'
import { applyMarkers, changedIds, MARKER } from './markers'

export interface DiffViewOptions {
  /** Resolve the old/base XML, or null when the file was newly added. */
  loadOld: () => Promise<string | null>
  /** Resolve the new/head XML, or null when the file was deleted. */
  loadNew: () => Promise<string | null>
}

export interface DiffViewHandle {
  destroy(): void
  /** Re-centre the currently-visible viewers (used after the host un-collapses
   *  the file, since a panel mounted while collapsed had no size to fit to). */
  refit(): void
}

type Viewer = any

interface Pane {
  wrap: HTMLElement
  canvas: HTMLElement
  keys: { add: HTMLElement; rem: HTMLElement; chg: HTMLElement; mov: HTMLElement }
  nav: { prev: HTMLButtonElement; next: HTMLButtonElement; all: HTMLButtonElement }
}

type ModelView = 'diff' | 'plain'

const EMPTY_DIFF: BpmnDiff = { added: [], removed: [], changed: [], moved: [] }
const FOCUS_ZOOM = 1.3
const ZOOM_STEP = 1.2

export function mountDiffView(container: HTMLElement, options: DiffViewOptions): DiffViewHandle {
  // The only switch: the Plain head model (default) vs the before/after Diff.
  const tabPlain = h('button', {
    class: 'git-diagram-tab is-active',
    type: 'button',
    text: 'Plain',
  })
  const tabDiff = h('button', { class: 'git-diagram-tab', type: 'button', text: 'Diff' })
  const tabs = h('div', { class: 'git-diagram-tabs' }, [tabPlain, tabDiff])

  const btnOut = h('button', {
    class: 'git-diagram-btn',
    type: 'button',
    title: 'Zoom out',
    text: '−',
  })
  const btnFit = h('button', {
    class: 'git-diagram-btn',
    type: 'button',
    title: 'Fit',
    text: 'Fit',
  })
  const btnIn = h('button', {
    class: 'git-diagram-btn',
    type: 'button',
    title: 'Zoom in',
    text: '+',
  })
  const controls = h('div', { class: 'git-diagram-controls' }, [btnOut, btnFit, btnIn])

  const toolbar = h('div', { class: 'git-diagram-toolbar' }, [tabs, controls])

  const left = buildPane()
  const right = buildPane()
  const grid = h('div', { class: 'git-diagram-di-grid' }, [left.wrap, right.wrap])

  const plainCanvas = h('div', { class: 'git-diagram-di-canvas' })
  const plainPane = h('div', { class: 'git-diagram-di-pane git-diagram-di-single' }, [plainCanvas])
  const plainView = h('div', { class: 'git-diagram-di-grid' }, [plainPane])

  const diagramArea = h('div', { class: 'git-diagram-di-area' }, [grid, plainView])
  const root = h('div', { class: 'git-diagram-wrap git-diagram-di-root' }, [toolbar, diagramArea])
  container.append(root)
  // Theme the chrome/labels/markers to match the host page (read once it's in the DOM).
  root.dataset.theme = detectHostTheme(root)

  let oldViewer: Viewer | null = null
  let newViewer: Viewer | null = null
  let plainViewer: Viewer | null = null
  let headXml: string | null = null
  let headLoaded = false
  let plainRendered = false
  let modelView: ModelView = 'plain'
  let destroyed = false
  let resizeObserver: ResizeObserver | null = null

  const visibleViewers = (): (Viewer | null)[] =>
    modelView === 'diff' ? [oldViewer, newViewer] : [plainViewer]

  const fitViewer = (viewer: Viewer | null) => {
    if (viewer) fitWithPadding(viewer.get('canvas'))
  }
  /** Centre every currently-visible viewer in its pane. */
  const fitVisible = () => {
    for (const viewer of visibleViewers()) fitViewer(viewer)
  }

  const applyModelView = () => {
    const isDiff = modelView === 'diff'
    grid.style.display = isDiff ? '' : 'none'
    plainView.style.display = isDiff ? 'none' : ''
    tabDiff.classList.toggle('is-active', isDiff)
    tabPlain.classList.toggle('is-active', !isDiff)
    if (!isDiff) void ensurePlain()
    // A pane that was hidden had no size to fit to; re-centre now it is shown.
    fitVisible()
  }

  tabDiff.addEventListener('click', () => {
    modelView = 'diff'
    applyModelView()
  })
  tabPlain.addEventListener('click', () => {
    modelView = 'plain'
    applyModelView()
  })
  applyModelView()

  // Re-fit when the panel resizes (window/sidebar) to keep diagrams centred.
  resizeObserver = new ResizeObserver(() => fitVisible())
  resizeObserver.observe(diagramArea)

  const zoom = (factor: number) => {
    for (const viewer of visibleViewers()) {
      if (!viewer) continue
      const canvas = viewer.get('canvas')
      canvas.zoom(canvas.zoom() * factor)
    }
  }
  btnIn.addEventListener('click', () => zoom(ZOOM_STEP))
  btnOut.addEventListener('click', () => zoom(1 / ZOOM_STEP))
  btnFit.addEventListener('click', fitVisible)

  // Toggle zoomScroll on every viewer so both diff panes stay in sync; a viewer
  // that mounts later re-applies the current state via applyInteractive().
  let interactive = false
  const applyInteractive = () => {
    for (const viewer of [oldViewer, newViewer, plainViewer]) toggleZoomScroll(viewer, interactive)
  }
  const detachFocusZoom = enableFocusZoom(diagramArea, (active) => {
    interactive = active
    applyInteractive()
  })

  void load()

  /** Render the current (head) model into its pane — only once, and only when needed. */
  async function ensurePlain(): Promise<void> {
    if (plainRendered || destroyed || !headLoaded) return
    plainRendered = true
    plainViewer = await mountViewer(plainCanvas, headXml, 'No current model (file deleted).')
    applyInteractive()
    if (modelView === 'plain') fitViewer(plainViewer)
  }

  async function load(): Promise<void> {
    const [oldXml, newXml] = await Promise.all([safe(options.loadOld), safe(options.loadNew)])
    if (destroyed) return
    headXml = newXml
    headLoaded = true

    oldViewer = await mountViewer(left.canvas, oldXml, 'not in source')
    newViewer = await mountViewer(right.canvas, newXml, 'deleted')
    if (destroyed) {
      teardown()
      return
    }
    applyInteractive()

    let diff = EMPTY_DIFF
    if (oldXml && newXml) {
      try {
        diff = await diffBpmn(oldXml, newXml)
      } catch {
        diff = EMPTY_DIFF
      }
      if (destroyed) return
      applyMarkers(oldViewer, newViewer, diff)
    }

    setLegend(left, diff)
    setLegend(right, diff)
    setupNav([left, right], [oldViewer, newViewer], diff)

    // The user may have flipped to Plain while base/head were still loading.
    if (modelView === 'plain') void ensurePlain()
    else fitVisible()
  }

  function teardown(): void {
    oldViewer?.destroy()
    newViewer?.destroy()
    plainViewer?.destroy()
    oldViewer = null
    newViewer = null
    plainViewer = null
  }

  return {
    destroy() {
      destroyed = true
      detachFocusZoom()
      resizeObserver?.disconnect()
      resizeObserver = null
      teardown()
      root.remove()
    },
    refit() {
      fitVisible()
    },
  }
}

async function mountViewer(
  canvas: HTMLElement,
  xml: string | null,
  emptyLabel: string,
): Promise<Viewer | null> {
  if (!xml) {
    canvas.append(h('div', { class: 'git-diagram-di-empty', text: emptyLabel }))
    return null
  }
  try {
    return await createThemedViewer(canvas, xml)
  } catch (err) {
    canvas.append(
      h('div', { class: 'git-diagram-di-empty', text: `render error: ${errorMessage(err)}` }),
    )
    return null
  }
}

function buildPane(): Pane {
  const keys = {
    add: legendKey('k-add', 'Added: 0'),
    rem: legendKey('k-rem', 'Removed: 0'),
    chg: legendKey('k-chg', 'Changed: 0'),
    mov: legendKey('k-mov', 'Moved: 0'),
  }
  const legend = h('div', { class: 'git-diagram-di-legend' }, [
    keys.add,
    keys.rem,
    keys.chg,
    keys.mov,
  ])

  const nav = {
    prev: navButton('Prev'),
    next: navButton('Next'),
    all: navButton('All'),
  }
  const navBar = h('div', { class: 'git-diagram-di-nav' }, [nav.prev, nav.next, nav.all])

  const overlay = h('div', { class: 'git-diagram-di-overlay' }, [legend, navBar])
  const canvas = h('div', { class: 'git-diagram-di-canvas' })
  const wrap = h('div', { class: 'git-diagram-di-pane' }, [overlay, canvas])
  return { wrap, canvas, keys, nav }
}

function legendKey(cls: string, text: string): HTMLElement {
  return h('span', { class: `k ${cls}`, text })
}

function navButton(text: string): HTMLButtonElement {
  return h('button', { class: 'git-diagram-di-navbtn', type: 'button', text })
}

function setLegend(pane: Pane, diff: BpmnDiff): void {
  pane.keys.add.textContent = `Added: ${diff.added.length}`
  pane.keys.rem.textContent = `Removed: ${diff.removed.length}`
  pane.keys.chg.textContent = `Changed: ${diff.changed.length}`
  pane.keys.mov.textContent = `Moved: ${diff.moved.length}`
}

function setupNav(panes: Pane[], viewers: (Viewer | null)[], diff: BpmnDiff): void {
  const ids = changedIds(diff)
  let index = -1
  let activeId: string | null = null

  const clearActive = () => {
    if (!activeId) return
    for (const viewer of viewers) {
      if (viewer?.get('elementRegistry').get(activeId)) {
        viewer.get('canvas').removeMarker(activeId, MARKER.active)
      }
    }
    activeId = null
  }

  const focus = (id: string) => {
    clearActive()
    activeId = id
    for (const viewer of viewers) {
      if (!viewer) continue
      const element = viewer.get('elementRegistry').get(id)
      if (!element) continue
      const canvas = viewer.get('canvas')
      canvas.addMarker(id, MARKER.active)
      canvas.zoom(FOCUS_ZOOM)
      canvas.scrollToElement(element)
    }
  }

  const showAll = () => {
    clearActive()
    index = -1
    for (const viewer of viewers) if (viewer) fitWithPadding(viewer.get('canvas'))
  }

  const go = (direction: number) => {
    if (!ids.length) return
    index = (index + direction + ids.length) % ids.length
    focus(ids[index]!)
  }

  for (const pane of panes) {
    pane.nav.prev.addEventListener('click', () => go(-1))
    pane.nav.next.addEventListener('click', () => go(1))
    pane.nav.all.addEventListener('click', showAll)
    if (!ids.length) {
      pane.nav.prev.disabled = true
      pane.nav.next.disabled = true
    }
  }
}

async function safe(load: () => Promise<string | null>): Promise<string | null> {
  try {
    return await load()
  } catch {
    return null
  }
}
