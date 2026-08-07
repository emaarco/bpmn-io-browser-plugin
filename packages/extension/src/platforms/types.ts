/**
 * A git hosting platform (GitLab / GitHub) as far as the blob viewer cares:
 * how to recognise a file (blob) page, where its raw content lives, and where to
 * insert the rendered diagram. Which *diagram kind* a blob is (BPMN, DMN, …) is
 * decided from the file extension by the kind registry, not here.
 *
 * The diagram is inserted as our own container **above** the host's code — we
 * never hide or move the code (additive), which keeps us robust against the host
 * re-rendering its code area (Code <-> Blame, SPA navigation).
 */
export interface BlobPlatform {
  readonly id: 'gitlab' | 'github'

  /** True when the current location is a file (blob) page on this host. */
  isBlob(location: Location): boolean

  /** URL that serves the raw file content for the current blob page. */
  rawUrl(location: Location): string

  /** Repo-relative file path (used for the panel title). */
  filePath(location: Location): string

  /**
   * The full-width block to insert our diagram container *before*. Found by
   * locating the rendered code content and climbing to the nearest stable,
   * full-width ancestor — out of the host's narrow / flex / horizontally
   * scrolling code column — so the diagram spans the file's width instead of
   * being squished beside the code. Null while the code area hasn't rendered.
   */
  findInsertAnchor(doc: Document): HTMLElement | null
}

export interface BlobPlatformConfig {
  id: BlobPlatform['id']
  /** Path segment identifying a blob page, e.g. `/-/blob/` or `/blob/`. */
  blobSegment: string
  /** Replacement segment that yields the raw URL, e.g. `/-/raw/` or `/raw/`. */
  rawSegment: string
  /** Selectors locating the rendered code content (proves the blob has loaded). */
  contentSelectors: string[]
  /**
   * From the code content, `.closest(insertClimb)` yields the full-width block we
   * insert our container before: on GitLab the whole file card (`.file-holder`,
   * the code sits in a flex row), on GitHub the enclosing `section` (the code is
   * a horizontally-scrolling column below the file header).
   */
  insertClimb: string
}

/**
 * Build a {@link BlobPlatform} from static per-host config.
 */
export function createBlobPlatform(config: BlobPlatformConfig): BlobPlatform {
  function findCode(doc: Document): HTMLElement | null {
    for (const selector of config.contentSelectors) {
      const el = doc.querySelector<HTMLElement>(selector)
      if (el) return el
    }
    return null
  }

  return {
    id: config.id,

    isBlob(location) {
      return location.pathname.includes(config.blobSegment)
    },

    rawUrl(location) {
      return (
        location.origin +
        location.pathname.replace(config.blobSegment, config.rawSegment) +
        location.search
      )
    },

    filePath(location) {
      const [path] = location.pathname.split(config.blobSegment).slice(1)
      if (!path) return location.pathname
      // Strip the leading `<ref>/` (branch or commit) from the blob path.
      const withoutRef = path.replace(/^[^/]+\//, '')
      return decodeURIComponent(withoutRef)
    },

    findInsertAnchor(doc) {
      const code = findCode(doc)
      if (!code) return null
      return code.closest<HTMLElement>(config.insertClimb) ?? code
    },
  }
}
