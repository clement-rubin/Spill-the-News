import Link from 'next/link'
import { getArticles, type Article } from '@/lib/articles'
import { getEpisodes, type Episode } from '@/lib/episodes'
import { getVisitStats } from '@/lib/stats'

const STATIC_PATH_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/articles': 'Articles',
  '/podcast': 'Podcast',
  '/signup': 'Inscription',
}

export function resolvePathLabel(path: string, articles: Article[], episodes: Episode[]): string {
  const staticLabel = STATIC_PATH_LABELS[path]
  if (staticLabel) return staticLabel

  const articleSlug = path.match(/^\/articles\/(.+)$/)?.[1]
  if (articleSlug) {
    const article = articles.find((a) => a.slug === articleSlug)
    if (article) return article.title
  }

  const episodeId = path.match(/^\/podcast\/(.+)$/)?.[1]
  if (episodeId) {
    const episode = episodes.find((e) => e.id === episodeId)
    if (episode) return episode.title
  }

  return path
}

export const metadata = { title: 'Tableau de bord — Spill the News' }

// Visit counts come from Supabase REST calls, which Next.js otherwise
// caches indefinitely as fetch requests (no revalidatePath covers every
// page view). The dashboard needs a live read on every load.
export const dynamic = 'force-dynamic'

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminDashboard() {
  const [articles, episodes, stats] = await Promise.all([
    getArticles(),
    getEpisodes(),
    getVisitStats(),
  ])

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <div>
          <span className="kicker">Espace contributeurs</span>
          <h1>Tableau de bord</h1>
        </div>
        <Link href="/admin/newsletter" className="btn btn--sm">
          Newsletter
        </Link>
      </div>

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Statistiques</h2>
            <p className="section-count">Visites du site et abonnés newsletter</p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.tableMissing ? '—' : stats.total}</span>
            <span className="stat-label">Visites totales</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.tableMissing ? '—' : stats.today}</span>
            <span className="stat-label">Aujourd&apos;hui</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.tableMissing ? '—' : stats.last7Days}</span>
            <span className="stat-label">7 derniers jours</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.newsletterCount}</span>
            <span className="stat-label">Abonnés newsletter</span>
          </div>
        </div>

        {stats.tableMissing && (
          <div className="empty">
            <strong>Suivi des visites pas encore activé</strong>
            Exécute ce SQL une fois dans l&apos;éditeur SQL de Supabase, puis recharge cette page :
            <pre className="admin-sql">{`CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`}</pre>
          </div>
        )}

        {!stats.tableMissing && stats.topPaths.length > 0 && (
          <div className="admin-list" style={{ marginTop: '1.2rem' }}>
            {stats.topPaths.map((p) => (
              <div className="admin-row" key={p.path}>
                <strong>{p.path}</strong>
                <span className="meta">{p.count} vues</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Articles</h2>
            <p className="section-count">{articles.length} publié(s)</p>
          </div>
          <Link href="/admin/articles/new" className="btn btn--sm">
            + Nouvel article
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="admin-list">
            {articles.map((article) => (
              <div className="admin-row" key={article.id}>
                <div>
                  <strong>{article.title}</strong>
                  <div className="meta">
                    {article.category} · {formatDate(article.publishedAt)}
                  </div>
                </div>
                <Link href={`/admin/articles/${article.id}/edit`} className="btn btn--ghost btn--sm">
                  Éditer
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>Aucun article</strong>
            Crée le premier pour lancer le média.
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Épisodes</h2>
            <p className="section-count">{episodes.length} publié(s)</p>
          </div>
          <Link href="/admin/episodes/new" className="btn btn--sm">
            + Nouvel épisode
          </Link>
        </div>

        {episodes.length > 0 ? (
          <div className="admin-list">
            {episodes.map((episode) => (
              <div className="admin-row" key={episode.id}>
                <div>
                  <strong>{episode.title}</strong>
                  <div className="meta">{formatDate(episode.publishedAt)}</div>
                </div>
                <Link href={`/admin/episodes/${episode.id}/edit`} className="btn btn--ghost btn--sm">
                  Éditer
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>Aucun épisode</strong>
            Ajoute un lien Spotify.
          </div>
        )}
      </section>
    </div>
  )
}
