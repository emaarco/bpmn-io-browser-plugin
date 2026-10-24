import type { ChangedFile } from '../../diff/DiffSource'
import { DIFF_PANEL_TAG } from '../../injectedElements'
import { kindDetector, type KindDetector } from '../../kinds/KindDetector'
import { hasRenderedBox } from '../../utils/isRendered'
import { gitlabSelectors } from './gitlabSelectors'

export class GitlabDiffScanner {
  constructor(private readonly kinds: KindDetector = kindDetector) {}

  scan(doc: Document): ChangedFile[] {
    const files: ChangedFile[] = []
    doc.querySelectorAll<HTMLElement>(gitlabSelectors.diff.fileRoot).forEach((root) => {
      const path = this.filePathOf(root)
      if (!path || !this.kinds.isDiffable(path)) return
      files.push({
        path,
        anchor: this.contentOf(root),
        append: 'first',
        fileRoot: root,
        isCollapsed: () => this.isCollapsed(root),
      })
    })
    return files
  }

  private isCollapsed(root: HTMLElement): boolean {
    const content = root.querySelector<HTMLElement>(gitlabSelectors.diff.collapseContent)
    if (!content) return true
    const hostContent = Array.from(content.children).filter(
      (child) => child.localName !== DIFF_PANEL_TAG,
    )
    return !hostContent.some(hasRenderedBox)
  }

  private filePathOf(root: HTMLElement): string | null {
    const attribute = gitlabSelectors.diff.pathAttr
    const withData = root.matches(attribute) ? root : root.querySelector(attribute)
    if (withData) return withData.getAttribute('data-path')
    const titleEl = root.querySelector(gitlabSelectors.diff.titleEl)
    if (titleEl) return titleEl.getAttribute('title') || titleEl.textContent?.trim() || null
    return null
  }

  private contentOf(root: HTMLElement): HTMLElement {
    const explicit = root.querySelector<HTMLElement>(gitlabSelectors.diff.contentExplicit)
    if (explicit) return explicit
    const title = root.querySelector<HTMLElement>(gitlabSelectors.diff.titleForSibling)
    const next = title?.nextElementSibling
    if (next instanceof HTMLElement) return next
    return root
  }
}
