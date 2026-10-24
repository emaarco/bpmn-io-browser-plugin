import { errorMessage } from '../utils/errorMessage'
import { DiffDataError, type DiffFileBlock, type DiffPage, type DiffSource } from './DiffSource'

const RETRY_FAILED_LOAD_AFTER_MS = 60_000

interface CachedLoad<Data> {
  key: string
  promise: Promise<Data>
  failedAt: number | null
}

export class CachedDiffSource<Page extends { key: string }, Data> implements DiffSource {
  private cached: CachedLoad<Data> | null = null

  constructor(
    private readonly page: DiffPage<Page, Data>,
    private readonly now: () => number = () => Date.now(),
  ) {}

  pageKey(location: Location): string | null {
    return this.page.identify(location)?.key ?? null
  }

  async collect(location: Location, doc: Document): Promise<DiffFileBlock[]> {
    const page = this.page.identify(location)
    if (!page) return []
    const files = this.page.scan(doc)
    if (!files.length) return []
    let data: Data
    try {
      data = await this.load(location, page)
    } catch (err) {
      throw new DiffDataError(errorMessage(err), this.page.errorHint(location, err), files)
    }
    return files.map((file) => ({ ...file, ...this.page.loaders(location, file, data) }))
  }

  private load(location: Location, page: Page): Promise<Data> {
    if (this.cached?.key === page.key && !this.mayRetry(this.cached)) return this.cached.promise
    const entry: CachedLoad<Data> = {
      key: page.key,
      failedAt: null,
      promise: this.page.load(location, page).catch((err) => {
        entry.failedAt = this.now()
        throw err
      }),
    }
    this.cached = entry
    return entry.promise
  }

  private mayRetry(entry: CachedLoad<Data>): boolean {
    return entry.failedAt != null && this.now() - entry.failedAt >= RETRY_FAILED_LOAD_AFTER_MS
  }
}
