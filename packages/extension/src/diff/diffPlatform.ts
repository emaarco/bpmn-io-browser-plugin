/**
 * A host-agnostic view of a merge/pull-request diff page for the diff injector:
 * how to recognise the page and how to discover the changed diagram file boxes
 * currently in the DOM, each wired with its base/head XML loaders. Everything
 * host-specific (REST APIs, raw URLs, DOM selectors) lives behind
 * {@link DiffPlatform.collect}.
 */

export interface DiffFileBlock {
  /** Head (new) path — de-duplicates work, shown for debugging. */
  path: string
  /** The file's code element, our panel is inserted relative to it. */
  anchor: HTMLElement
  /** Where to place the panel relative to the anchor (above the code either way). */
  append: 'first' | 'before'
  /** The file's stable container in the host DOM (survives collapse); observed
   *  for viewed/collapse toggles so the panel can hide/show along with it. */
  fileRoot: HTMLElement
  /** True when the host currently renders this file collapsed (e.g. "marked as
   *  viewed"), so the panel should hide to match. Re-evaluated live on mutations. */
  isCollapsed(): boolean
  /** Base (old) XML, or null when the file was newly added. */
  loadOld: () => Promise<string | null>
  /** Head (new) XML, or null when the file was deleted. */
  loadNew: () => Promise<string | null>
}

export interface DiffPlatform {
  /** A stable key when the current location is a diff page, else null. */
  pageKey(location: Location): string | null
  /**
   * Discover the changed diagram file boxes currently in the DOM, wired with
   * their loaders. Returns [] when none are present yet (still loading, or
   * scrolled away in the host's virtual list). Per-page metadata is fetched once
   * and cached internally; throws when that fetch fails.
   */
  collect(location: Location, doc: Document): Promise<DiffFileBlock[]>
}
