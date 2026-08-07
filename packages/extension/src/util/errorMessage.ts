/** Human-readable message for an unknown thrown value (Error or otherwise). */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
