import { beforeEach, describe, expect, it } from 'vitest'
import { githubPlatform } from '../../src/platforms/github'

/**
 * The blob viewer picks its insert point by locating the host's rendered code
 * and climbing to a stable full-width ancestor. These selectors track GitHub's
 * real DOM (`[data-testid="code-lines-container"]`, `#read-only-cursor-text-area`,
 * enclosing `<section>`); a redesign that renames them would silently break
 * injection, so pin the contract here — fast, no browser.
 */
describe('githubPlatform.findInsertAnchor', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('climbs from the code container to the enclosing <section>', () => {
    document.body.innerHTML = `
      <div id="repo-content">
        <section id="target">
          <div class="file-header"></div>
          <div data-testid="code-lines-container">code…</div>
        </section>
      </div>`

    const anchor = githubPlatform.findInsertAnchor(document)
    expect(anchor).toBe(document.getElementById('target'))
  })

  it('also recognises the textarea selector', () => {
    document.body.innerHTML = `
      <section id="target">
        <textarea id="read-only-cursor-text-area">code…</textarea>
      </section>`

    expect(githubPlatform.findInsertAnchor(document)).toBe(document.getElementById('target'))
  })

  it('falls back to the code element itself when there is no <section> ancestor', () => {
    document.body.innerHTML = `<div data-testid="code-lines-container">code…</div>`

    const code = document.querySelector('[data-testid="code-lines-container"]')
    expect(githubPlatform.findInsertAnchor(document)).toBe(code)
  })

  it('returns null while the code area has not rendered yet', () => {
    document.body.innerHTML = `<section><div class="file-header"></div></section>`
    expect(githubPlatform.findInsertAnchor(document)).toBeNull()
  })
})
