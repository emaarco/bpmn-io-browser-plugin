/**
 * GitLab merge-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Changes tab and wires each to base/head raw URLs, using MR metadata (SHAs,
 * per-file change info) loaded once from the GitLab REST API.
 */

import type { DiffFileBlock, DiffPlatform } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { isBpmnPath, loadMrData, mrInfo, rawFileUrl, type MrData, type MrInfo } from './gitlabMr'

interface FileBox {
  path: string
  content: HTMLElement
  root: HTMLElement
}

/** Tag name of our injected shadow-root panel (the `name` in diffRunner's createShadowRootUi). */
const PANEL_TAG = 'git-diagram-diff'

export function gitlabDiffPlatform(): DiffPlatform {
  let cached: { key: string; promise: Promise<MrData> } | null = null

  const ensureData = (location: Location, info: MrInfo): Promise<MrData> => {
    if (cached?.key === info.key) return cached.promise
    const promise = loadMrData(location, info).catch((err) => {
      if (cached?.key === info.key) cached = null // let the next run retry
      throw err
    })
    cached = { key: info.key, promise }
    return promise
  }

  return {
    pageKey: (location) => mrInfo(location)?.key ?? null,
    async collect(location, doc) {
      const info = mrInfo(location)
      if (!info) return []
      const boxes = bpmnFileBoxes(doc)
      if (!boxes.length) return []
      const data = await ensureData(location, info)
      return boxes.map((box) => toBlock(box, data))
    },
  }
}

function toBlock(box: FileBox, data: MrData): DiffFileBlock {
  const change = data.changeByPath.get(box.path)
  const oldPath = change?.old_path || box.path
  return {
    path: box.path,
    anchor: box.content,
    append: 'first',
    fileRoot: box.root,
    isCollapsed: () => isFileCollapsed(box.root),
    loadOld: () =>
      change?.new_file
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(data.origin, data.pid, oldPath, data.refs.base_sha)),
    loadNew: () =>
      change?.deleted_file
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(data.origin, data.pid, box.path, data.refs.head_sha)),
  }
}

function bpmnFileBoxes(doc: Document): FileBox[] {
  const roots = doc.querySelectorAll<HTMLElement>('.diff-file, [data-testid="file-holder"]')
  const boxes: FileBox[] = []
  roots.forEach((root) => {
    const path = filePathOf(root)
    if (!isBpmnPath(path)) return
    boxes.push({ path: path!, content: contentOf(root), root })
  })
  return boxes
}

/**
 * True when GitLab renders this file collapsed — chevron-collapsed or "marked as
 * viewed"; both hide the code. Rather than matching version-specific body markup
 * (which differs across GitLab releases and self-hosted instances), we treat the
 * file as collapsed when its content area shows no laid-out host content besides
 * our own injected panel. That survives GitLab collapsing the body by removing
 * it, `display:none`-ing it, or clipping it to zero height.
 */
function isFileCollapsed(root: HTMLElement): boolean {
  const content = root.querySelector<HTMLElement>(
    '.diff-content, [data-testid="content-area"], [data-testid="diff-content"]',
  )
  if (!content) return true
  for (const child of Array.from(content.children)) {
    if (child.tagName.toLowerCase() === PANEL_TAG) continue
    if (hasRenderedBox(child)) return false
  }
  return true
}

/** Connected and laid out with a non-zero box (not detached, display:none, or clipped to 0). */
function hasRenderedBox(el: Element): boolean {
  if (!el.isConnected || el.getClientRects().length === 0) return false
  return el.getBoundingClientRect().height > 0
}

function filePathOf(root: HTMLElement): string | null {
  const withData = root.matches('[data-path]') ? root : root.querySelector('[data-path]')
  if (withData) return withData.getAttribute('data-path')
  const titleEl = root.querySelector('.file-title-name, [data-testid="file-title"]')
  if (titleEl) return titleEl.getAttribute('title') || titleEl.textContent?.trim() || null
  return null
}

function contentOf(root: HTMLElement): HTMLElement {
  const explicit = root.querySelector<HTMLElement>('.diff-content, [data-testid="diff-content"]')
  if (explicit) return explicit
  const title = root.querySelector<HTMLElement>(
    '.file-title, .js-file-title, [data-testid="file-title"], .file-title-flex-parent',
  )
  const next = title?.nextElementSibling
  if (next instanceof HTMLElement) return next
  return root
}
