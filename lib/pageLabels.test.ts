import { describe, it, expect } from 'vitest'
import type { Article } from './articles'
import type { Episode } from './episodes'
import { resolvePathLabel } from './pageLabels'

const author = { id: 'author-1', name: 'Jane', email: 'jane@example.com' }

const articles: Article[] = [
  {
    id: 'article-1',
    title: 'La Watch Party de retour',
    slug: 'la-watch-party-de-retour',
    coverImage: null,
    body: 'body',
    category: 'Culture',
    publishedAt: new Date('2026-09-30'),
    authorId: author.id,
    author,
  },
]

const episodes: Episode[] = [
  {
    id: 'episode-1',
    title: 'Premier épisode',
    description: 'desc',
    externalLink: 'https://open.spotify.com/episode/xyz',
    coverImage: null,
    publishedAt: new Date('2026-09-28'),
    authorId: author.id,
    author,
  },
]

describe('resolvePathLabel', () => {
  it('resolves the homepage', () => {
    expect(resolvePathLabel('/', articles, episodes)).toBe('Accueil')
  })

  it('resolves the articles list', () => {
    expect(resolvePathLabel('/articles', articles, episodes)).toBe('Articles')
  })

  it('resolves the podcast list', () => {
    expect(resolvePathLabel('/podcast', articles, episodes)).toBe('Podcast')
  })

  it('resolves signup', () => {
    expect(resolvePathLabel('/signup', articles, episodes)).toBe('Inscription')
  })

  it('resolves an article path to its title', () => {
    expect(resolvePathLabel('/articles/la-watch-party-de-retour', articles, episodes)).toBe(
      'La Watch Party de retour'
    )
  })

  it('resolves an episode path to its title', () => {
    expect(resolvePathLabel('/podcast/episode-1', articles, episodes)).toBe('Premier épisode')
  })

  it('falls back to the raw path for an unknown article slug', () => {
    expect(resolvePathLabel('/articles/does-not-exist', articles, episodes)).toBe(
      '/articles/does-not-exist'
    )
  })

  it('falls back to the raw path for a totally unrelated route', () => {
    expect(resolvePathLabel('/some/random/path', articles, episodes)).toBe('/some/random/path')
  })
})
