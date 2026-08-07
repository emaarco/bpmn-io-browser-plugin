import { createBlobPlatform } from './types'

export const githubPlatform = createBlobPlatform({
  id: 'github',
  blobSegment: '/blob/',
  rawSegment: '/raw/',
  contentSelectors: ['[data-testid="code-lines-container"]', '#read-only-cursor-text-area'],
  // The code lives in a horizontally-scrolling column; climb to the enclosing
  // <section> (full width, below the file header) and insert the diagram there.
  insertClimb: 'section',
})
