/**
 * Every GitHub DOM selector the content scripts depend on, in one place so a
 * GitHub redesign is a **one-file, reviewable fix**. Which page we're on and
 * where raw content lives is URL-based (see `github.ts` / `githubPrUrls.ts`), not
 * here — this file is purely "how do we find things inside the rendered page".
 *
 * Each entry documents what it maps to on real github.com. Selector arrays / the
 * comma-lists inside a single string are ordered preference → fallback.
 */
export const githubSelectors = {
  /** Blob (single-file) view — the inline viewer. */
  blob: {
    /**
     * The rendered code container — its presence proves the blob has loaded, and
     * the insert anchor is found by climbing from it. React "code lines" container
     * first, then the legacy read-only code textarea.
     */
    content: ['[data-testid="code-lines-container"]', '#read-only-cursor-text-area'],
    /**
     * From the code container, climb to this full-width ancestor and insert the
     * diagram before it: the `<section>` wrapping the file header + the
     * horizontally-scrolling code column.
     */
    insertClimb: 'section',
  },

  /** Pull-request "Files changed" view — the diff viewer. */
  diff: {
    /** Per-file container in the legacy diff experience. */
    fileRootLegacy: '.file[data-tagsearch-path], .js-file',
    /** Stable hook in the React experience; climbed to its owning `#diff-<hash>`. */
    diffHeaderWrapper: '[data-diff-header-wrapper]',
    /** The React per-file container the header wrapper lives in (class names are hashed). */
    modernRootClimb: 'div[id^="diff-"]',
    /** File-path attributes on the legacy container, in preference order. */
    pathAttrs: ['data-tagsearch-path', 'data-path'],
    /** Legacy header element holding the file name (via `title` or text). */
    legacyPathEl: '.file-info a, .file-header [title]',
    /** React header heading holding the path (fallback when `aria-labelledby` misses). */
    modernHeading: '[data-diff-header-wrapper] h3',
    /** React diff code table — the diagram anchors relative to its parent. */
    modernCode: 'table[data-diff-anchor]',
    /** Legacy diff code body, in preference order. */
    legacyCode: '.js-file-content, .data.highlight, .diff-table',
  },
}
