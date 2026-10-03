import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { gitlabDiffPlatform } from '../src/platforms/gitlabDiff'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    runDiff(ctx, gitlabDiffPlatform())
  },
})
