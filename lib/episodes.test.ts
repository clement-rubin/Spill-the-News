import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

// Episodes have no slug logic — test the shared slugify utility here
describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Épisode Un')).toBe('episode-un')
  })

  it('strips accents', () => {
    expect(slugify('même titre')).toBe('meme-titre')
  })

  it('collapses multiple spaces', () => {
    expect(slugify('a  b')).toBe('a-b')
  })

  it('strips special chars', () => {
    expect(slugify("L'actu & vous")).toBe('lactu-vous')
  })
})
