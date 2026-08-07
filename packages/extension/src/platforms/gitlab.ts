import { createBlobPlatform } from './types'

export const gitlabPlatform = createBlobPlatform({
  id: 'gitlab',
  blobSegment: '/-/blob/',
  rawSegment: '/-/raw/',
  contentSelectors: [
    '[data-testid="blob-viewer-file-content"]',
    '.blob-viewer',
    '.blob-content-holder',
    'main .file-content',
  ],
  // The code sits in a flex row; climb to the whole file card so our diagram
  // spans full width above the file box instead of squishing beside the code.
  insertClimb: '.file-holder',
})
