import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Bienvenue Sur Spill The News')).toBe('bienvenue-sur-spill-the-news')
  })

  it('strips accents', () => {
    expect(slugify('Étudiant à Paris')).toBe('etudiant-a-paris')
  })

  it('strips punctuation', () => {
    expect(slugify("L'université: c'est fini !")).toBe('luniversite-cest-fini')
  })

  it('collapses repeated whitespace', () => {
    expect(slugify('trop   d\'espaces')).toBe('trop-despaces')
  })
})
