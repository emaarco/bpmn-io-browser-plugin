import { defineContentScript } from 'wxt/utils/define-content-script'
import { gitlabPlatform } from '../src/platforms/gitlab'
import { runBlobViewer } from '../src/inject/blobViewer'

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'manual',
  main(ctx) {
    runBlobViewer(ctx, gitlabPlatform)
  },
})
