import { describe, it, expect } from 'vitest'
import { safeNext } from './safeNext'

describe('safeNext', () => {
  it('accepts a relative path', () => {
    expect(safeNext('/reset-password')).toBe('/reset-password')
  })

  it('defaults to /admin when null', () => {
    expect(safeNext(null)).toBe('/admin')
  })

  it('defaults to /admin when empty', () => {
    expect(safeNext('')).toBe('/admin')
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeNext('//evil.com')).toBe('/admin')
  })

  it('rejects an absolute URL', () => {
    expect(safeNext('https://evil.com')).toBe('/admin')
  })

  it('rejects a path with no leading slash', () => {
    expect(safeNext('evil.com')).toBe('/admin')
  })
})
