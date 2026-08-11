import { browser, $, expect } from '@wdio/globals'

/**
 * The GitHub pull-request content script: on the "Files changed" view it should
 * read the PR metadata (base/head SHAs + file list) from `/api/v3`, fetch the
 * changed `.bpmn` file's XML, and mount the diff panel with a rendered diagram
 * above the file's code box. Runs identically on Chrome, Edge and Firefox.
 */
describe('GitHub PR diff (content script)', () => {
  it('mounts a diff panel with a rendered diagram for a changed .bpmn file', async () => {
    await browser.url('/octo/flows/pull/1/files')

    const host = $('git-diagram-diff')
    await host.waitForExist({ timeout: 20_000 })

    // The default "Plain" view renders the head model — a diagram-js canvas.
    const shape = host.shadow$('.djs-element')
    await expect(shape).toBeExisting()

    // Additive: the host's own diff table stays in the page.
    await expect($('table[data-diff-anchor]')).toBeExisting()
  })
})
