import { defineContentScript } from 'wxt/utils/define-content-script'
import { gitlabPlatform } from '../src/platforms/gitlab'
import { runBlobViewer } from '../src/inject/blobViewer'

export default defineContentScript({
  matches: ['https://gitlab.com/*/-/blob/*'],
  cssInjectionMode: 'manual',
  runAt: 'document_idle',
  main(ctx) {
    runBlobViewer(ctx, gitlabPlatform)
  },
})
