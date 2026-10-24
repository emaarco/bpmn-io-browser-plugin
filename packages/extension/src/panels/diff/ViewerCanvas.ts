import type { DiagramViewer } from '../../kinds/DiagramKind'
import { h } from '../../utils/dom'
import { errorMessage } from '../../utils/errorMessage'

const LOADING_LABEL = 'Loading diagram…'

export type CreateViewer<Viewer extends DiagramViewer> = (
  canvas: HTMLElement,
  xml: string,
) => Promise<Viewer>

export class ViewerCanvas<Viewer extends DiagramViewer> {
  readonly element = h('div', { class: 'git-diagram-di-canvas' }, [this.label(LOADING_LABEL)])
  viewer: Viewer | null = null

  async render(
    createViewer: CreateViewer<Viewer>,
    xml: string | null,
    emptyLabel: string,
  ): Promise<Viewer | null> {
    this.element.replaceChildren()
    if (!xml) {
      this.element.append(this.label(emptyLabel))
      return null
    }
    try {
      this.viewer = await createViewer(this.element, xml)
    } catch (err) {
      this.element.append(this.label(`render error: ${errorMessage(err)}`))
    }
    return this.viewer
  }

  destroy(): void {
    this.viewer?.destroy()
    this.viewer = null
  }

  private label(text: string): HTMLElement {
    return h('div', { class: 'git-diagram-di-empty', text })
  }
}
