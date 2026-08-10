import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { browser, $, expect } from '@wdio/globals'

/**
 * The standalone viewer page (`viewer.html`) uses no extension APIs, so we drive
 * it directly over HTTP from the built output — it exercises the real bundled
 * bpmn-js / dmn-js render path via file upload. Runs on all three browsers.
 */
const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

async function expectRenders(fixture: string): Promise<void> {
  await browser.url('/viewer.html')
  const input = await $('input[type=file]')
  await input.waitForExist()
  // The input is `display:none` by design; reveal it so WebDriver treats it as
  // interactable, then hand it the fixture path (the page reads `input.files`).
  await browser.execute((el) => {
    ;(el as HTMLElement).style.display = 'block'
  }, input)
  await input.setValue(join(fixtures, fixture))
  await expect($('.canvas svg')).toBeExisting()
  await expect($('.djs-element')).toBeExisting()
}

describe('standalone viewer page', () => {
  it('renders a .bpmn file with bpmn-js', async () => {
    await expectRenders('sample.bpmn')
  })

  it('renders a .dmn file with dmn-js', async () => {
    await expectRenders('sample.dmn')
  })
})
