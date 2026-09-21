import { vi, describe, it, expect } from 'vitest'

// Must be hoisted before any import that touches lib/supabase.ts
vi.mock('./supabase', () => ({ supabase: {} }))

import { generateUniqueSlug } from './articles'

describe('generateUniqueSlug', () => {
  it('returns base slug when not taken', () => {
    expect(generateUniqueSlug('mon-article', new Set())).toBe('mon-article')
  })

  it('appends -2 when base is taken', () => {
    expect(generateUniqueSlug('mon-article', new Set(['mon-article']))).toBe('mon-article-2')
  })

  it('increments suffix until free', () => {
    const taken = new Set(['mon-article', 'mon-article-2', 'mon-article-3'])
    expect(generateUniqueSlug('mon-article', taken)).toBe('mon-article-4')
  })

  it('does not skip suffix 2 even if -3 is taken', () => {
    const taken = new Set(['mon-article', 'mon-article-3'])
    expect(generateUniqueSlug('mon-article', taken)).toBe('mon-article-2')
  })
})
