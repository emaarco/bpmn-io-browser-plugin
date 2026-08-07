import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { gitlabDiffPlatform } from '../src/platforms/gitlabDiff'

export default defineContentScript({
  matches: ['https://gitlab.com/*/-/merge_requests/*'],
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runDiff(ctx, gitlabDiffPlatform())
  },
})
