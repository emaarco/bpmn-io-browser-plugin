/**
 * Factory shared by the GitHub PR and single-commit diff platforms. Both key the
 * page off a URL-derived `{ key }` info object and load their base/head metadata
 * once from a REST endpoint, then reuse the identical DOM scan
 * ({@link ./githubDiffDom}) to place a diagram panel above each changed `.bpmn`
 * file. Only `info` (which URLs count) and `load` (which endpoint) vary.
 */

import type { DiffPlatform } from '../diff/diffPlatform'
import { type GithubDiffData, scanBpmnFileBoxes, toBlock } from './githubDiffDom'

interface DiffInfo {
  key: string
}

export function createGithubDiffPlatform<Info extends DiffInfo>(
  info: (location: Location) => Info | null,
  load: (location: Location, info: Info) => Promise<GithubDiffData>,
): DiffPlatform {
  let cached: { key: string; promise: Promise<GithubDiffData> } | null = null

  const ensureData = (location: Location, page: Info): Promise<GithubDiffData> => {
    if (cached?.key === page.key) return cached.promise
    const promise = load(location, page).catch((err) => {
      if (cached?.key === page.key) cached = null // let the next run retry
      throw err
    })
    cached = { key: page.key, promise }
    return promise
  }

  return {
    pageKey: (location) => info(location)?.key ?? null,
    async collect(location, doc) {
      const page = info(location)
      if (!page) return []
      const boxes = scanBpmnFileBoxes(doc)
      if (!boxes.length) return []
      const data = await ensureData(location, page)
      return boxes.map((box) => toBlock(location, box, data))
    },
  }
}
