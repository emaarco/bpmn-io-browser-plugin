/**
 * A host-agnostic view of a merge/pull-request diff page for the diff injector:
 * how to recognise the page and how to discover the changed diagram file boxes
 * currently in the DOM, each wired with its base/head XML loaders. Everything
 * host-specific (REST APIs, raw URLs, DOM selectors) lives behind
 * {@link DiffPlatform.collect}.
 */

/** Where an injected panel attaches, independent of what it renders. */
export interface DiffPanelSlot {
  /** The file's code element, our panel is inserted relative to it. */
  anchor: HTMLElement
  /** Where to place the panel relative to the anchor (above the code either way). */
  append: 'first' | 'before'
  /** The file's stable container in the host DOM (survives collapse). */
  fileRoot: HTMLElement
}

export interface DiffFileBlock extends DiffPanelSlot {
  /** Head (new) path — de-duplicates work, shown for debugging. */
  path: string
  /** True when the host currently renders this file collapsed (e.g. "marked as
   *  viewed"), so the panel should hide to match. Re-evaluated live on mutations.
   *  `fileRoot` (from {@link DiffPanelSlot}) is observed to drive this. */
  isCollapsed(): boolean
  /** Base (old) XML, or null when the file was newly added. */
  loadOld: () => Promise<string | null>
  /** Head (new) XML, or null when the file was deleted. */
  loadNew: () => Promise<string | null>
}

/**
 * Thrown by {@link DiffPlatform.collect} when the per-page metadata fetch fails
 * but changed diagram files *are* on the page — so the driver can surface an
 * actionable notice in each file's slot instead of failing silently. Carries a
 * short, host-specific {@link hint} (e.g. "add a GitHub token") on top of the raw
 * error message.
 */
export class DiffDataError extends Error {
  constructor(
    message: string,
    /** A short, actionable hint shown under the raw message. */
    readonly hint: string,
    /** One slot per changed diagram file box currently in the DOM. */
    readonly slots: DiffPanelSlot[],
  ) {
    super(message)
    this.name = 'DiffDataError'
  }
}

export interface DiffPlatform {
  /** A stable key when the current location is a diff page, else null. */
  pageKey(location: Location): string | null
  /**
   * Discover the changed diagram file boxes currently in the DOM, wired with
   * their loaders. Returns [] when none are present yet (still loading, or
   * scrolled away in the host's virtual list). Per-page metadata is fetched once
   * and cached internally; throws a {@link DiffDataError} (with the affected
   * slots) when that fetch fails while files are on the page, else a plain Error.
   */
  collect(location: Location, doc: Document): Promise<DiffFileBlock[]>
}
