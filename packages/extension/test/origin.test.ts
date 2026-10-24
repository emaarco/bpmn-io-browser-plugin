import { describe, expect, it } from 'vitest'
import { normalizeOrigin, originToPattern, patternToOrigin } from '../src/utils/origin'

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

describe('origin <-> pattern', () => {
  it('round-trips a concrete origin', () => {
    const pattern = originToPattern('https://gitlab.example.com')
    expect(pattern).toBe('https://gitlab.example.com/*')
    expect(patternToOrigin(pattern)).toBe('https://gitlab.example.com')
  })

  it('keeps an explicit port', () => {
    expect(patternToOrigin('http://localhost:8080/*')).toBe('http://localhost:8080')
  })

  it('returns null for wildcard / non-origin patterns', () => {
    expect(patternToOrigin('<all_urls>')).toBeNull()
    expect(patternToOrigin('*://*/*')).toBeNull()
  })
})
