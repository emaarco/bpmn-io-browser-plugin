import { describe, expect, it } from 'vitest'
import { normalizeOrigin } from '../src/hosts/origin'

describe('normalizeOrigin', () => {
  it('defaults to https and strips path/query', () => {
    expect(normalizeOrigin('gitlab.example.com')).toBe('https://gitlab.example.com')
    expect(normalizeOrigin('https://gitlab.example.com/some/path')).toBe(
      'https://gitlab.example.com',
    )
  })

  it('keeps an explicit scheme and port', () => {
    expect(normalizeOrigin('http://localhost:8080')).toBe('http://localhost:8080')
  })

  it('rejects non-http(s) and empty input', () => {
    expect(normalizeOrigin('ftp://example.com')).toBeNull()
    expect(normalizeOrigin('   ')).toBeNull()
    expect(normalizeOrigin('https://has space.com')).toBeNull()
  })
})
