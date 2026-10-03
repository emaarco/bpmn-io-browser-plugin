import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { githubDiffPlatform } from '../src/platforms/githubDiff'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    runDiff(ctx, githubDiffPlatform())
  },
})
