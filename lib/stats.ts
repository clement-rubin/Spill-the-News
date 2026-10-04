import { supabase } from './supabase'
import { parseContentPath } from './contentPath'

export interface ViewCount {
  total: number
  last7Days: number
}

export interface VisitStats {
  tableMissing: boolean
  total: number
  today: number
  last7Days: number
  articleViews: number
  episodeViews: number
  /** Keyed by article slug. */
  byArticle: Map<string, ViewCount>
  /** Keyed by episode id. */
  byEpisode: Map<string, ViewCount>
  newsletterCount: number
}

interface ViewRow {
  path: string
  created_at: string
}

// Postgres itself reports a missing table as 42P01; PostgREST (Supabase's
// REST layer) instead reports PGRST205 when the table isn't in its schema
// cache — which is what actually comes back here.
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205'])

// PostgREST caps a response at 1000 rows, so views are read page by page.
const PAGE_SIZE = 1000
const MAX_ROWS = 50_000

function bump(map: Map<string, ViewCount>, key: string, recent: boolean) {
  const entry = map.get(key) ?? { total: 0, last7Days: 0 }
  entry.total += 1
  if (recent) entry.last7Days += 1
  map.set(key, entry)
}

/** Slugs and ids of the content still online; views of anything else are dropped. */
export interface KnownContent {
  articles: Set<string>
  episodes: Set<string>
}

export function aggregateViews(rows: ViewRow[], known?: KnownContent, now = new Date()) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const result = {
    total: 0,
    today: 0,
    last7Days: 0,
    articleViews: 0,
    episodeViews: 0,
    byArticle: new Map<string, ViewCount>(),
    byEpisode: new Map<string, ViewCount>(),
  }

  for (const row of rows) {
    const content = parseContentPath(row.path)
    if (!content) continue
    // A deleted or renamed piece would inflate totals nobody can trace back.
    const live = content.kind === 'article' ? known?.articles : known?.episodes
    if (live && !live.has(content.key)) continue

    const at = new Date(row.created_at)
    const recent = at >= weekAgo
    result.total += 1
    if (at >= today) result.today += 1
    if (recent) result.last7Days += 1

    if (content.kind === 'article') {
      result.articleViews += 1
      bump(result.byArticle, content.key, recent)
    } else {
      result.episodeViews += 1
      bump(result.byEpisode, content.key, recent)
    }
  }

  return result
}

async function fetchContentViews() {
  const rows: ViewRow[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('page_views')
      .select('path, created_at')
      .or('path.like./articles/%,path.like./podcast/%')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) return { rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return { rows, error: null }
}

export async function getVisitStats(known?: KnownContent): Promise<VisitStats> {
  const [views, newsletterRes] = await Promise.all([
    fetchContentViews(),
    supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }),
  ])
  const newsletterCount = newsletterRes.count ?? 0

  if (views.error && MISSING_TABLE_CODES.has(views.error.code)) {
    return { ...aggregateViews([]), tableMissing: true, newsletterCount }
  }

  return { ...aggregateViews(views.rows, known), tableMissing: false, newsletterCount }
}
