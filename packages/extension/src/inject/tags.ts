/**
 * Tag names of the custom elements this extension injects into host pages. Kept
 * in one place because the diff platforms' collapse logic probes the host DOM and
 * must skip our own panel — so the tag it checks has to stay identical to the
 * `name` the shadow-root UI is mounted with.
 */

/** Blob viewer shadow host — mounted by `runBlobViewer` above the file's code. */
export const HOST_TAG = 'bpmn-io-browser-plugin'

/** Diff panel shadow host — mounted by `runDiff` above each changed file's code. */
export const DIFF_PANEL_TAG = 'git-diagram-diff'
