/**
 * GitLab merge-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Changes tab and wires each to base/head raw URLs, using MR metadata (SHAs,
 * per-file change info) loaded once from the GitLab REST API.
 */

import { createDiffPlatform } from '../diff/createDiffPlatform'
import type { DiffFileBlock, DiffPanelSlot, DiffPlatform } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { DIFF_PANEL_TAG } from '../inject/tags'
import { isBpmnPath } from '../kinds/detect'
import { gitlabSelectors } from './gitlab.selectors'
import { loadMrData, type MrData } from './gitlabMr'
import { mrInfo, rawFileUrl } from './gitlabMrUrls'

interface FileBox {
  path: string
  content: HTMLElement
  root: HTMLElement
}

export function gitlabDiffPlatform(): DiffPlatform {
  return createDiffPlatform({
    info: mrInfo,
    scan: bpmnFileBoxes,
    slotOf,
    load: loadMrData,
    toBlock: (_location, box, data) => toBlock(box, data),
    errorHint: () =>
      'Could not load the merge request metadata from the GitLab API. Check that you are signed in and can open this merge request.',
  })
}

const slotOf = (box: FileBox): DiffPanelSlot => ({
  anchor: box.content,
  append: 'first',
  fileRoot: box.root,
})

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
  const roots = doc.querySelectorAll<HTMLElement>(gitlabSelectors.diff.fileRoot)
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
  const content = root.querySelector<HTMLElement>(gitlabSelectors.diff.collapseContent)
  if (!content) return true
  for (const child of Array.from(content.children)) {
    if (child.tagName.toLowerCase() === DIFF_PANEL_TAG) continue
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
  const attr = gitlabSelectors.diff.pathAttr
  const withData = root.matches(attr) ? root : root.querySelector(attr)
  if (withData) return withData.getAttribute('data-path')
  const titleEl = root.querySelector(gitlabSelectors.diff.titleEl)
  if (titleEl) return titleEl.getAttribute('title') || titleEl.textContent?.trim() || null
  return null
}

function contentOf(root: HTMLElement): HTMLElement {
  const explicit = root.querySelector<HTMLElement>(gitlabSelectors.diff.contentExplicit)
  if (explicit) return explicit
  const title = root.querySelector<HTMLElement>(gitlabSelectors.diff.titleForSibling)
  const next = title?.nextElementSibling
  if (next instanceof HTMLElement) return next
  return root
}
