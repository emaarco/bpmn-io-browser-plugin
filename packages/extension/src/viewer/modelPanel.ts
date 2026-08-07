/**
 * A diagram viewer panel: a diagram canvas (drag-to-pan, scroll-zoom) with the
 * zoom controls floating in a corner overlay — not a top toolbar — so the host's
 * sticky file header (GitHub's Code/Blame bar) can never cover them.
 * Format-agnostic: the concrete viewer comes from the {@link DiagramKind}, so the
 * same panel renders BPMN, DMN, …
 *
 * Loads its XML lazily so the panel appears instantly with a placeholder and
 * fills in when the file arrives. The diagram is additive — inserted above the
 * host's code, which stays visible — so there is no Model/Code switch.
 */

import { h } from '../dom'
import { errorMessage } from '../util/errorMessage'
import type { DiagramKind, DiagramViewer } from '../kinds/types'

export interface ModelPanelHandle {
  destroy(): void
}

export interface ModelPanelOptions {
  /** The diagram kind (BPMN, DMN, …) that renders this file. */
  kind: DiagramKind
  loadXml: () => Promise<string>
}

const ZOOM_STEP = 1.2

export function mountModelPanel(
  container: HTMLElement,
  options: ModelPanelOptions,
): ModelPanelHandle {
  const placeholder = h('div', { class: 'git-diagram-placeholder', text: 'Loading diagram…' })

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
  // A sibling of the canvas, so it never touches the viewer library's container.
  const controls = h('div', { class: 'git-diagram-controls' }, [btnOut, btnFit, btnIn])

  const canvas = h('div', { class: 'git-diagram-canvas' }, [placeholder])

  const wrap = h('div', { class: 'git-diagram-wrap' }, [canvas, controls])
  container.append(wrap)

  let viewer: DiagramViewer | null = null
  let destroyed = false
  let resizeObserver: ResizeObserver | null = null

  void load()

  async function load(): Promise<void> {
    let xml: string
    try {
      xml = await options.loadXml()
    } catch (err) {
      placeholder.textContent = `Could not load file: ${errorMessage(err)}`
      return
    }
    if (destroyed) return

    let instance: DiagramViewer
    try {
      instance = await options.kind.createViewer(canvas, xml)
    } catch (err) {
      placeholder.textContent = `Could not render ${options.kind.label}: ${errorMessage(err)}`
      return
    }
    if (destroyed) {
      instance.destroy()
      return
    }

    viewer = instance
    placeholder.remove()
    btnIn.addEventListener('click', () => viewer?.zoom(ZOOM_STEP))
    btnOut.addEventListener('click', () => viewer?.zoom(1 / ZOOM_STEP))
    btnFit.addEventListener('click', () => viewer?.fit())

    viewer.fit()
    // Re-fit when the container resizes (window/sidebar) to keep it centred.
    resizeObserver = new ResizeObserver(() => viewer?.fit())
    resizeObserver.observe(canvas)
  }

  return {
    destroy() {
      destroyed = true
      resizeObserver?.disconnect()
      resizeObserver = null
      viewer?.destroy()
      viewer = null
      wrap.remove()
    },
  }
}
