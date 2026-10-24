import { beforeEach, describe, expect, it } from 'vitest'
import { githubHost } from '../../src/git-hosts/hosts'

const blobPage = githubHost.blobPage

describe('GitHub blob page insert anchor', () => {
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

    expect(blobPage.findInsertAnchor(document)).toBe(document.getElementById('target'))
  })

  it('also recognises the textarea selector', () => {
    document.body.innerHTML = `
      <section id="target">
        <textarea id="read-only-cursor-text-area">code…</textarea>
      </section>`

    expect(blobPage.findInsertAnchor(document)).toBe(document.getElementById('target'))
  })

  it('falls back to the code element itself when there is no <section> ancestor', () => {
    document.body.innerHTML = `<div data-testid="code-lines-container">code…</div>`

    const code = document.querySelector('[data-testid="code-lines-container"]')
    expect(blobPage.findInsertAnchor(document)).toBe(code)
  })

  it('returns null while the code area has not rendered yet', () => {
    document.body.innerHTML = `<section><div class="file-header"></div></section>`
    expect(blobPage.findInsertAnchor(document)).toBeNull()
  })
})
