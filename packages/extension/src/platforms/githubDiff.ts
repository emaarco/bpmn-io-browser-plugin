/**
 * GitHub pull-request {@link DiffPlatform}: finds changed `.bpmn` file boxes on
 * the Files tab and wires each to base/head raw URLs, using PR metadata (SHAs,
 * per-file status) loaded once from the GitHub REST API. Handles both the legacy
 * diff and the React "Files changed" experience; see {@link fileRoots}.
 */

import type { DiffFileBlock, DiffPlatform } from '../diff/diffPlatform'
import { fetchText } from '../net/client'
import { isRendered } from '../util/isRendered'
import {
  isBpmnPath,
  loadPrData,
  normalizeDiffPath,
  prInfo,
  rawFileUrl,
  type PrData,
  type PrInfo,
} from './githubPr'

interface FileBox {
  path: string
  code: HTMLElement
  root: HTMLElement
}

export function githubDiffPlatform(): DiffPlatform {
  let cached: { key: string; promise: Promise<PrData> } | null = null

  const ensureData = (location: Location, info: PrInfo): Promise<PrData> => {
    if (cached?.key === info.key) return cached.promise
    const promise = loadPrData(location, info).catch((err) => {
      if (cached?.key === info.key) cached = null // let the next run retry
      throw err
    })
    cached = { key: info.key, promise }
    return promise
  }

  return {
    pageKey: (location) => prInfo(location)?.key ?? null,
    async collect(location, doc) {
      const info = prInfo(location)
      if (!info) return []
      const boxes = bpmnFileBoxes(doc)
      if (!boxes.length) return []
      const data = await ensureData(location, info)
      return boxes.map((box) => toBlock(location, box, data))
    },
  }
}

function toBlock(location: Location, box: FileBox, data: PrData): DiffFileBlock {
  const file = data.fileByPath.get(box.path)
  const status = file?.status
  const oldPath = file?.previous_filename || box.path
  return {
    path: box.path,
    anchor: box.code,
    append: 'before',
    fileRoot: box.root,
    isCollapsed: () => !isRendered(codeOf(box.root)),
    loadOld: () =>
      status === 'added'
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.baseRepo, data.baseSha, oldPath)),
    loadNew: () =>
      status === 'removed'
        ? Promise.resolve(null)
        : fetchText(rawFileUrl(location, data.headRepo, data.headSha, box.path)),
  }
}

function bpmnFileBoxes(doc: Document): FileBox[] {
  const boxes: FileBox[] = []
  const seen = new Set<HTMLElement>()
  for (const root of fileRoots(doc)) {
    if (seen.has(root)) continue
    seen.add(root)
    const path = filePathOf(root)
    if (!isBpmnPath(path)) continue
    const code = codeOf(root)
    if (code) boxes.push({ path: path!, code, root })
  }
  return boxes
}

/**
 * Per-file diff containers for both the legacy diff and the React "Files changed"
 * experience. The React class names are hashed, so we key on the stable
 * `data-diff-header-wrapper` hook and climb to the owning `#diff-<hash>`.
 */
function fileRoots(doc: Document): HTMLElement[] {
  const legacy = [...doc.querySelectorAll<HTMLElement>('.file[data-tagsearch-path], .js-file')]
  const modern = [...doc.querySelectorAll<HTMLElement>('[data-diff-header-wrapper]')]
    .map((header) => header.closest<HTMLElement>('div[id^="diff-"]'))
    .filter((el): el is HTMLElement => el !== null)
  return [...legacy, ...modern]
}

function filePathOf(root: HTMLElement): string | null {
  const attr = root.getAttribute('data-tagsearch-path') || root.getAttribute('data-path')
  if (attr) return attr
  const modern = modernFilePath(root)
  if (modern) return modern
  const info = root.querySelector('.file-info a, .file-header [title]')
  return info?.getAttribute('title') || info?.textContent?.trim() || null
}

/** React experience: the container's `aria-labelledby` heading holds the path. */
function modernFilePath(root: HTMLElement): string | null {
  const headingId = root.getAttribute('aria-labelledby')
  const heading = headingId ? root.ownerDocument.getElementById(headingId) : null
  const raw =
    heading?.textContent ?? root.querySelector('[data-diff-header-wrapper] h3')?.textContent
  return raw ? normalizeDiffPath(raw) || null : null
}

function codeOf(root: HTMLElement): HTMLElement | null {
  const modern = root.querySelector<HTMLElement>('table[data-diff-anchor]')
  if (modern) return modern.parentElement ?? modern
  return root.querySelector<HTMLElement>('.js-file-content, .data.highlight, .diff-table')
}
