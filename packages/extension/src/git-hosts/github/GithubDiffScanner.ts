import type { ChangedFile } from '../../diff/DiffSource'
import { kindDetector, type KindDetector } from '../../kinds/KindDetector'
import { isRendered } from '../../utils/isRendered'
import { githubSelectors } from './githubSelectors'

const BIDI_MARKS = /[‎‏‪-‮⁦-⁩]/gu
const RENAME_ARROW = '→'

export class GithubDiffScanner {
  constructor(private readonly kinds: KindDetector = kindDetector) {}

  scan(doc: Document): ChangedFile[] {
    const files: ChangedFile[] = []
    const seen = new Set<HTMLElement>()
    for (const root of this.fileRoots(doc)) {
      if (seen.has(root)) continue
      seen.add(root)
      const path = this.filePathOf(root)
      if (!path || !this.kinds.isDiffable(path)) continue
      const code = this.codeOf(root)
      if (!code) continue
      files.push({
        path,
        anchor: code,
        append: 'before',
        fileRoot: root,
        isCollapsed: () => !isRendered(this.codeOf(root)),
      })
    }
    return files
  }

  private fileRoots(doc: Document): HTMLElement[] {
    const legacy = [...doc.querySelectorAll<HTMLElement>(githubSelectors.diff.fileRootLegacy)]
    const modern = [...doc.querySelectorAll<HTMLElement>(githubSelectors.diff.diffHeaderWrapper)]
      .map((header) => header.closest<HTMLElement>(githubSelectors.diff.modernRootClimb))
      .filter((el): el is HTMLElement => el !== null)
    return [...legacy, ...modern]
  }

  private filePathOf(root: HTMLElement): string | null {
    const attribute = githubSelectors.diff.pathAttrs
      .map((name) => root.getAttribute(name))
      .find((value): value is string => !!value)
    if (attribute) return attribute
    const modern = this.modernFilePath(root)
    if (modern) return modern
    const info = root.querySelector(githubSelectors.diff.legacyPathEl)
    return info?.getAttribute('title') || info?.textContent?.trim() || null
  }

  private modernFilePath(root: HTMLElement): string | null {
    const headingId = root.getAttribute('aria-labelledby')
    const heading = headingId ? root.ownerDocument.getElementById(headingId) : null
    const raw =
      heading?.textContent ?? root.querySelector(githubSelectors.diff.modernHeading)?.textContent
    return raw ? this.headSidePath(raw) || null : null
  }

  private headSidePath(headerText: string): string {
    const clean = headerText.replace(BIDI_MARKS, '').trim()
    return (clean.split(RENAME_ARROW).pop() ?? clean).trim()
  }

  private codeOf(root: HTMLElement): HTMLElement | null {
    const modern = root.querySelector<HTMLElement>(githubSelectors.diff.modernCode)
    if (modern) return modern.parentElement ?? modern
    return root.querySelector<HTMLElement>(githubSelectors.diff.legacyCode)
  }
}
