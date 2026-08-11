import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { githubCommitDiffPlatform } from '../src/platforms/githubCommitDiff'
import { withE2eMatches } from '../src/hosts/e2eMatches'

export default defineContentScript({
  matches: withE2eMatches(['https://github.com/*/commit/*'], ['http://localhost/*/commit/*']),
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runDiff(ctx, githubCommitDiffPlatform())
  },
})
