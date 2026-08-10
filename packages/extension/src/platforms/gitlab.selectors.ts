/**
 * Every GitLab DOM selector the content scripts depend on, in one place so a
 * GitLab redesign (or a self-hosted instance on an older release) is a
 * **one-file, reviewable fix**. Page/raw-URL detection is URL-based (see
 * `gitlab.ts` / `gitlabMrUrls.ts`), not here.
 *
 * Each entry documents what it maps to on real gitlab.com. Selector arrays / the
 * comma-lists inside a single string are ordered preference → fallback, chosen to
 * survive across GitLab versions and self-hosted instances.
 */
export const gitlabSelectors = {
  /** Blob (single-file) view — the inline viewer. */
  blob: {
    /** The rendered source-viewer content area; presence proves the blob loaded. */
    content: [
      '[data-testid="blob-viewer-file-content"]',
      '.blob-viewer',
      '.blob-content-holder',
      'main .file-content',
    ],
    /** Climb from the code to the whole file card and insert the diagram before it. */
    insertClimb: '.file-holder',
  },

  /** Merge-request "Changes" view — the diff viewer. */
  diff: {
    /** Per-file diff container (legacy class + newer test id). */
    fileRoot: '.diff-file, [data-testid="file-holder"]',
    /** Element carrying the file path (on the root itself or a descendant). */
    pathAttr: '[data-path]',
    /** File-title element holding the path via `title` / text. */
    titleEl: '.file-title-name, [data-testid="file-title"]',
    /** Explicit diff-body / content area (the insert anchor). */
    contentExplicit: '.diff-content, [data-testid="diff-content"]',
    /** File-title elements whose next sibling is the content, when no explicit one. */
    titleForSibling:
      '.file-title, .js-file-title, [data-testid="file-title"], .file-title-flex-parent',
    /** Content region probed for rendered children to detect collapse. */
    collapseContent: '.diff-content, [data-testid="content-area"], [data-testid="diff-content"]',
  },
}
