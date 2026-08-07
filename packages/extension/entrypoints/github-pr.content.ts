import { defineContentScript } from 'wxt/utils/define-content-script'
import { runDiff } from '../src/inject/diffRunner'
import { githubDiffPlatform } from '../src/platforms/githubDiff'

export default defineContentScript({
  matches: ['https://github.com/*/pull/*'],
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runDiff(ctx, githubDiffPlatform())
  },
})
