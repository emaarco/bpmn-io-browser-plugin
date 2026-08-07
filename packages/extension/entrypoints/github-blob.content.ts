import { defineContentScript } from 'wxt/utils/define-content-script'
import { githubPlatform } from '../src/platforms/github'
import { runBlobViewer } from '../src/inject/blobViewer'

export default defineContentScript({
  matches: ['https://github.com/*/blob/*'],
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runBlobViewer(ctx, githubPlatform)
  },
})
