import type { DiagramKind, DiagramViewer, KindLookup } from '../kinds/DiagramKind'
import { h } from '../utils/dom'
import { errorMessage } from '../utils/errorMessage'

export class StandaloneViewerPage {
  private readonly fileInput: HTMLInputElement
  private readonly openButton = h('button', { class: 'btn', type: 'button', text: 'Open file…' })
  private readonly canvas = h('div', { class: 'canvas' })
  private readonly dropzone: HTMLElement
  private readonly stage: HTMLElement
  private readonly loadedAssetCss = new Set<DiagramKind>()
  private viewer: DiagramViewer | null = null

  constructor(
    private readonly kinds: KindLookup,
    private readonly fileExtensions: string[],
  ) {
    const extensionList = fileExtensions.join(' or ')
    this.fileInput = h('input', {
      type: 'file',
      accept: fileExtensions.join(','),
      style: 'display:none',
    })
    this.dropzone = h('div', { class: 'dropzone' }, [
      h('span', { text: `Drop a ${extensionList} file here, or use “Open file…”.` }),
    ])
    this.stage = h('div', { class: 'stage' }, [this.canvas, this.dropzone])
  }

  mount(app: HTMLElement): void {
    const toolbar = h('div', { class: 'toolbar' }, [
      h('strong', { text: 'BPMN / DMN Viewer' }),
      h('span', { class: 'spacer' }),
      this.openButton,
      this.fileInput,
    ])
    app.append(toolbar, this.stage)
    this.listen()
  }

  private listen(): void {
    this.openButton.addEventListener('click', () => this.fileInput.click())
    this.fileInput.addEventListener('change', () => this.openFirst(this.fileInput.files))
    this.dropzone.addEventListener('dragover', (event) => {
      event.preventDefault()
      this.dropzone.classList.add('dragover')
    })
    this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('dragover'))
    this.stage.addEventListener('drop', (event) => {
      event.preventDefault()
      this.openFirst(event.dataTransfer?.files)
    })
    this.stage.addEventListener('dragover', (event) => event.preventDefault())
  }

  private openFirst(files: FileList | null | undefined): void {
    const file = files?.[0]
    if (file) void this.open(file)
  }

  private async open(file: File): Promise<void> {
    const kind = this.kinds.detect(file.name)
    if (!kind) {
      const expected = this.fileExtensions.join(' or ')
      this.showError(`Unsupported file: ${file.name} (expected ${expected}).`)
      return
    }
    this.loadAssetCss(kind)
    const xml = await file.text()
    this.viewer?.destroy()
    this.viewer = null
    this.canvas.replaceChildren()
    try {
      this.viewer = await kind.createViewer(this.canvas, xml)
      this.dropzone.classList.add('hidden')
    } catch (err) {
      this.showError(`Could not render ${kind.descriptor.label}: ${errorMessage(err)}`)
    }
  }

  private loadAssetCss(kind: DiagramKind): void {
    if (this.loadedAssetCss.has(kind)) return
    this.loadedAssetCss.add(kind)
    document.head.append(h('style', { text: kind.assetCss }))
  }

  private showError(text: string): void {
    this.dropzone.classList.remove('hidden', 'dragover')
    this.dropzone.replaceChildren(h('span', { class: 'error', text }))
  }
}
