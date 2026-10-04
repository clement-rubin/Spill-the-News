import { describe, it, expect, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { aggregateViews } from './stats'
import { isContentPath, parseContentPath } from './contentPath'

describe('parseContentPath', () => {
  it('recognises an article page by its slug', () => {
    expect(parseContentPath('/articles/la-watch-party')).toEqual({ kind: 'article', key: 'la-watch-party' })
  })

  it('recognises an episode page by its id', () => {
    expect(parseContentPath('/podcast/episode-1')).toEqual({ kind: 'episode', key: 'episode-1' })
  })

  it('ignores listings, the homepage and other pages', () => {
    for (const path of ['/', '/articles', '/podcast', '/signup', '/admin', '/articles/a/b']) {
      expect(isContentPath(path)).toBe(false)
    }
  })

  it('survives a malformed escape', () => {
    expect(parseContentPath('/articles/%E0%A4%A')).toEqual({ kind: 'article', key: '%E0%A4%A' })
  })
})

describe('aggregateViews', () => {
  const now = new Date('2026-10-04T15:00:00')
  const rows = [
    { path: '/articles/a', created_at: '2026-10-04T09:00:00' },
    { path: '/articles/a', created_at: '2026-10-01T09:00:00' },
    { path: '/articles/a', created_at: '2026-09-01T09:00:00' },
    { path: '/articles/b', created_at: '2026-10-04T10:00:00' },
    { path: '/podcast/ep-1', created_at: '2026-09-02T10:00:00' },
    { path: '/', created_at: '2026-10-04T10:00:00' },
    { path: '/articles', created_at: '2026-10-04T10:00:00' },
  ]

  it('counts only article and episode pages', () => {
    const stats = aggregateViews(rows, undefined, now)
    expect(stats.total).toBe(5)
    expect(stats.articleViews).toBe(4)
    expect(stats.episodeViews).toBe(1)
  })

  it('splits today and the last 7 days', () => {
    const stats = aggregateViews(rows, undefined, now)
    expect(stats.today).toBe(2)
    expect(stats.last7Days).toBe(3)
  })

  it('tallies each piece of content separately', () => {
    const stats = aggregateViews(rows, undefined, now)
    expect(stats.byArticle.get('a')).toEqual({ total: 3, last7Days: 2 })
    expect(stats.byArticle.get('b')).toEqual({ total: 1, last7Days: 1 })
    expect(stats.byEpisode.get('ep-1')).toEqual({ total: 1, last7Days: 0 })
  })

  it('drops views of content that no longer exists', () => {
    const known = { articles: new Set(['a']), episodes: new Set<string>() }
    const stats = aggregateViews(rows, known, now)
    expect(stats.total).toBe(3)
    expect(stats.articleViews).toBe(3)
    expect(stats.episodeViews).toBe(0)
    expect(stats.byArticle.has('b')).toBe(false)
  })
})
