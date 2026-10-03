import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { githubCommitDiffPlatform } from '../src/platforms/githubCommitDiff'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    runDiff(ctx, githubCommitDiffPlatform())
  },
})
