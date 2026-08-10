import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { githubDiffPlatform } from '../src/platforms/githubDiff'
import { withE2eMatches } from '../src/hosts/e2eMatches'

export default defineContentScript({
  matches: withE2eMatches(['https://github.com/*/pull/*'], ['http://localhost/*/pull/*']),
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runDiff(ctx, githubDiffPlatform())
  },
})
