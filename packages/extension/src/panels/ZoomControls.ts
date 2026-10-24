import { h } from '../utils/dom'

export interface Zoomable {
  zoomBy(factor: number): void
  fit(): void
}

const ZOOM_STEP = 1.2

export class ZoomControls {
  readonly element: HTMLElement

  constructor(target: Zoomable) {
    this.element = h('div', { class: 'git-diagram-controls' }, [
      this.button('Zoom out', '−', () => target.zoomBy(1 / ZOOM_STEP)),
      this.button('Fit', 'Fit', () => target.fit()),
      this.button('Zoom in', '+', () => target.zoomBy(ZOOM_STEP)),
    ])
  }

  private button(title: string, text: string, onClick: () => void): HTMLButtonElement {
    return h('button', { class: 'git-diagram-btn', type: 'button', title, text, onClick })
  }
}
