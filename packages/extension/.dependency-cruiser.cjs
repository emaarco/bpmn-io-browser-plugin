const VIEWER_LIBRARIES = '^src/kinds/(KindRegistry|bpmn/|dmn/)'
const PAGE_LAYERS = '^src/(page|panels|background|options|viewer-page)/'

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'git-hosts-stay-light',
      comment:
        'Git hosts are loaded by the background worker and the view router, so they must not pull in viewer libraries or page code.',
      severity: 'error',
      from: { path: '^src/(git-hosts|diff|host-access|messaging|settings)/' },
      to: { path: [VIEWER_LIBRARIES, PAGE_LAYERS] },
    },
    {
      name: 'panels-know-no-hosts',
      comment:
        'Panels render a diagram kind; which host the file comes from is none of their business.',
      severity: 'error',
      from: { path: '^src/panels/' },
      to: { path: ['^src/git-hosts/', '^src/page/(?!HostPage)', '^src/background/'] },
    },
    {
      name: 'utils-are-leaves',
      severity: 'error',
      from: { path: '^src/utils/' },
      to: { path: '^src/', pathNot: ['^src/utils/', '^src/messaging/HttpClient\\.ts$'] },
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
