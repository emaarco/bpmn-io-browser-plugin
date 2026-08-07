/**
 * Architecture guardrail for the core's source layers.
 *
 * Layering (imports only ever point "down"):
 *   adapter/ -> domain/     (moddle XML -> parsed model)
 *   domain/  -> (leaf; pure diff, no bpmn-moddle, no DOM)
 *
 * Keeping domain/ a pure leaf is what makes the diff testable in plain Node.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Circular dependencies make the module graph hard to reason about.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-a-leaf',
      comment: 'domain/ is the pure diff core; it must not import from adapter/.',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/adapter/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^src/',
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js'],
    },
  },
}
