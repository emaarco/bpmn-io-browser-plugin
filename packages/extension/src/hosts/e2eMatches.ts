/**
 * E2E test builds (`WXT_E2E=1`) let the git-host content scripts additionally run
 * on `http://localhost/*`, so the WebdriverIO suite can serve GitHub-shaped
 * fixture pages from a local server instead of driving the real github.com (auth,
 * rate limits, DOM churn). Read at **build time only** — WXT evaluates each
 * entrypoint in Node to extract its `matches`, where `process.env` is available;
 * at runtime the flag is already baked into the generated manifest and unused.
 *
 * Mirrors the `WXT_DEV_EXAMPLE` flag pattern used in `wxt.config.ts`.
 */
const E2E_BUILD = Boolean(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.WXT_E2E,
)

/** Append the localhost `matches` in an E2E build, otherwise return `base` as-is. */
export function withE2eMatches(base: string[], localhost: string[]): string[] {
  return E2E_BUILD ? [...base, ...localhost] : base
}
