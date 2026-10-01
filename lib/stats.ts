import { supabase } from './supabase'

export interface VisitStats {
  tableMissing: boolean
  total: number
  today: number
  last7Days: number
  topPaths: { path: string; count: number }[]
  newsletterCount: number
}

// Postgres itself reports a missing table as 42P01; PostgREST (Supabase's
// REST layer) instead reports PGRST205 when the table isn't in its schema
// cache — which is what actually comes back here.
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205'])

function startOfDay(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export async function getVisitStats(): Promise<VisitStats> {
  const empty: VisitStats = {
    tableMissing: false,
    total: 0,
    today: 0,
    last7Days: 0,
    topPaths: [],
    newsletterCount: 0,
  }

  const [totalRes, todayRes, weekRes, recentRes, newsletterRes] = await Promise.all([
    supabase.from('page_views').select('*', { count: 'exact', head: true }),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay()),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    supabase.from('page_views').select('path').order('created_at', { ascending: false }).limit(500),
    supabase.from('newsletter_subscriptions').select('*', { count: 'exact', head: true }),
  ])

  // A `head: true` count against a missing table comes back as a silent
  // 204/null from PostgREST instead of an error, so detect via the one
  // real (non-head) query instead.
  if (recentRes.error && MISSING_TABLE_CODES.has(recentRes.error.code)) {
    return { ...empty, tableMissing: true, newsletterCount: newsletterRes.count ?? 0 }
  }

  const counts = new Map<string, number>()
  for (const row of recentRes.data ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1)
  }
  const topPaths = Array.from(counts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    tableMissing: false,
    total: totalRes.count ?? 0,
    today: todayRes.count ?? 0,
    last7Days: weekRes.count ?? 0,
    topPaths,
    newsletterCount: newsletterRes.count ?? 0,
  }
}
