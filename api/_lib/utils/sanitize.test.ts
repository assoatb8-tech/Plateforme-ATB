import { describe, expect, it } from 'vitest'
import { stripHtmlTags } from './sanitize.js'

describe('stripHtmlTags', () => {
  it('removes a script tag and its content markers, leaving the inner text', () => {
    expect(stripHtmlTags('<script>alert(1)</script>XSS Test')).toBe('alert(1)XSS Test')
  })

  it('removes an img tag with an onerror attribute entirely', () => {
    expect(stripHtmlTags('<img src=x onerror=alert(1)>Description test')).toBe('Description test')
  })

  it('removes simple inline tags', () => {
    expect(stripHtmlTags('<b>Location</b> test')).toBe('Location test')
  })

  it('leaves plain text untouched', () => {
    expect(stripHtmlTags('Plain text, no markup')).toBe('Plain text, no markup')
  })

  it('trims surrounding whitespace after stripping', () => {
    expect(stripHtmlTags('  <p>padded</p>  ')).toBe('padded')
  })

  it('handles multiple separate tags', () => {
    expect(stripHtmlTags('<div><span>nested</span></div>')).toBe('nested')
  })

  it('returns an empty string when the input is only markup', () => {
    expect(stripHtmlTags('<script></script>')).toBe('')
  })
})
