import { describe, it, expect } from 'vitest'

import {
  MAX_COVERS,
  droppedCoverUrls,
  parseCovers,
  readCoversField,
  serializeCovers,
} from './covers'

const A = 'https://x.test/a.webp'
const B = 'https://x.test/b.webp'

describe('parseCovers', () => {
  it('reads a bare URL as one cover without caption', () => {
    expect(parseCovers(A)).toEqual([{ url: A, caption: '' }])
  })

  it('reads a JSON list, keeping order and captions', () => {
    const raw = JSON.stringify([
      { url: A, caption: 'Un' },
      { url: B, caption: '' },
    ])
    expect(parseCovers(raw)).toEqual([
      { url: A, caption: 'Un' },
      { url: B, caption: '' },
    ])
  })

  it('yields nothing for empty, null or broken values', () => {
    expect(parseCovers(null)).toEqual([])
    expect(parseCovers('  ')).toEqual([])
    expect(parseCovers('[not json')).toEqual([])
  })

  it('drops entries that are not http(s) URLs', () => {
    const raw = JSON.stringify([{ url: 'javascript:alert(1)', caption: 'x' }, { url: A }])
    expect(parseCovers(raw)).toEqual([{ url: A, caption: '' }])
  })
})

describe('serializeCovers', () => {
  it('stores a lone captionless photo as the bare URL, as before', () => {
    expect(serializeCovers([{ url: A, caption: '' }])).toBe(A)
  })

  it('stores captions and multiple photos as JSON', () => {
    const covers = [
      { url: A, caption: 'Un' },
      { url: B, caption: '' },
    ]
    expect(parseCovers(serializeCovers(covers))).toEqual(covers)
    expect(serializeCovers([{ url: A, caption: 'Légende' }])).toMatch(/^\[/)
  })

  it('stores no photo as null', () => {
    expect(serializeCovers([])).toBeNull()
  })
})

describe('readCoversField', () => {
  it('accepts a list and tidies captions', () => {
    expect(readCoversField(JSON.stringify([{ url: A, caption: '  Une   légende \n' }]))).toEqual({
      covers: [{ url: A, caption: 'Une légende' }],
    })
  })

  it('leaves the stored covers alone when the field is absent', () => {
    expect(readCoversField(null)).toEqual({})
    expect(readCoversField(undefined)).toEqual({})
  })

  it('reads an empty list as "remove every cover"', () => {
    expect(readCoversField('[]')).toEqual({ covers: [] })
  })

  it('rejects garbage, bad URLs and too many photos', () => {
    expect(readCoversField('nope')).toHaveProperty('error')
    expect(readCoversField('{}')).toHaveProperty('error')
    expect(readCoversField(JSON.stringify([{ url: 'ftp://x', caption: '' }]))).toHaveProperty('error')
    const many = Array.from({ length: MAX_COVERS + 1 }, () => ({ url: A, caption: '' }))
    expect(readCoversField(JSON.stringify(many))).toHaveProperty('error')
  })
})

describe('droppedCoverUrls', () => {
  it('lists only the photos that are gone', () => {
    const before = [{ url: A, caption: '' }, { url: B, caption: '' }]
    expect(droppedCoverUrls(before, [{ url: B, caption: 'nouvelle légende' }])).toEqual([A])
  })
})
