const IS_E2E_BUILD = Boolean(
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.WXT_E2E,
)

export function withE2eMatches(base: string[], localhost: string[]): string[] {
  return IS_E2E_BUILD ? [...base, ...localhost] : base
}
