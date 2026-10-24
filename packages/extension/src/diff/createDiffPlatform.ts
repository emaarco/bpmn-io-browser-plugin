/**
 * Host-neutral {@link DiffPlatform}: caches the per-page metadata, backs off
 * after a failed load and turns that failure into a {@link DiffDataError}. Each
 * host supplies only a {@link DiffHostAdapter} — which URLs count, how to scan
 * its DOM, which endpoint to load and how to explain a failure.
 */

import { errorMessage } from '../util/errorMessage'
import {
  DiffDataError,
  type DiffFileBlock,
  type DiffPanelSlot,
  type DiffPlatform,
} from './diffPlatform'

export interface DiffHostAdapter<Info extends { key: string }, Data, Box> {
  info(location: Location): Info | null
  scan(doc: Document): Box[]
  slotOf(box: Box): DiffPanelSlot
  load(location: Location, info: Info): Promise<Data>
  toBlock(location: Location, box: Box, data: Data): DiffFileBlock
  errorHint(location: Location, err: unknown): string
}

/**
 * After a failed metadata fetch, keep the failure cached this long before a fresh
 * attempt is allowed. The diff driver re-runs on every debounced DOM mutation, so
 * without this a 404 or a rate-limit 403 would re-fire the same failing API calls
 * on every scroll.
 */
const RETRY_FAILED_AFTER_MS = 60_000

export function createDiffPlatform<Info extends { key: string }, Data, Box>(
  adapter: DiffHostAdapter<Info, Data, Box>,
): DiffPlatform {
  let cached: { key: string; promise: Promise<Data>; failedAt: number | null } | null = null

  const ensureData = (location: Location, page: Info): Promise<Data> => {
    if (cached?.key === page.key) {
      const cooling =
        cached.failedAt != null && Date.now() - cached.failedAt < RETRY_FAILED_AFTER_MS
      if (cached.failedAt == null || cooling) return cached.promise
    }
    const entry: NonNullable<typeof cached> = {
      key: page.key,
      failedAt: null,
      promise: adapter.load(location, page).catch((err) => {
        entry.failedAt = Date.now()
        throw err
      }),
    }
    cached = entry
    return entry.promise
  }

  return {
    pageKey: (location) => adapter.info(location)?.key ?? null,
    async collect(location, doc) {
      const page = adapter.info(location)
      if (!page) return []
      const boxes = adapter.scan(doc)
      if (!boxes.length) return []
      let data: Data
      try {
        data = await ensureData(location, page)
      } catch (err) {
        throw new DiffDataError(
          errorMessage(err),
          adapter.errorHint(location, err),
          boxes.map(adapter.slotOf),
        )
      }
      return boxes.map((box) => adapter.toBlock(location, box, data))
    },
  }
}
