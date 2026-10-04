import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'
import { getVisitStats, type ViewCount } from '@/lib/stats'

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

function formatViews(count: ViewCount | undefined) {
  const total = count?.total ?? 0
  return `${total} vue${total > 1 ? 's' : ''}`
}

interface RankedItem {
  key: string
  title: string
  href: string
  views: ViewCount
}

/** Most viewed first, dropping content nobody has opened yet. */
function rank<T>(
  items: T[],
  counts: Map<string, ViewCount>,
  pick: (item: T) => Omit<RankedItem, 'views'>
): RankedItem[] {
  return items
    .map((item) => {
      const base = pick(item)
      return { ...base, views: counts.get(base.key) ?? { total: 0, last7Days: 0 } }
    })
    .filter((item) => item.views.total > 0)
    .sort((a, b) => b.views.total - a.views.total || b.views.last7Days - a.views.last7Days)
    .slice(0, 5)
}

function Ranking({ title, items, empty }: { title: string; items: RankedItem[]; empty: string }) {
  return (
    <div className="stat-ranking">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ol className="admin-list">
          {items.map((item, index) => (
            <li className="admin-row" key={item.key}>
              <div>
                <span className="stat-rank">{index + 1}</span>
                <Link href={item.href} target="_blank">
                  <strong>{item.title}</strong>
                </Link>
              </div>
              <span className="meta">
                {formatViews(item.views)}
                {item.views.last7Days > 0 && ` · +${item.views.last7Days} cette semaine`}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="meta stat-empty">{empty}</p>
      )}
    </div>
  )
}

export default async function AdminDashboard() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])
  const stats = await getVisitStats({
    articles: new Set(articles.map((a) => a.slug)),
    episodes: new Set(episodes.map((e) => e.id)),
  })

  const topArticles = rank(articles, stats.byArticle, (a) => ({
    key: a.slug,
    title: a.title,
    href: `/articles/${a.slug}`,
  }))
  const topEpisodes = rank(episodes, stats.byEpisode, (e) => ({
    key: e.id,
    title: e.title,
    href: `/podcast/${e.id}`,
  }))

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
                    {!stats.tableMissing && ` · ${formatViews(stats.byArticle.get(article.slug))}`}
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
                  <div className="meta">
                    {formatDate(episode.publishedAt)}
                    {!stats.tableMissing && ` · ${formatViews(stats.byEpisode.get(episode.id))}`}
                  </div>
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

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Statistiques</h2>
            <p className="section-count">Vues des articles et des épisodes, abonnés newsletter</p>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.tableMissing ? '—' : stats.articleViews}</span>
            <span className="stat-label">Vues articles</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.tableMissing ? '—' : stats.episodeViews}</span>
            <span className="stat-label">Vues épisodes</span>
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

        {!stats.tableMissing && (
          <div className="stat-rankings">
            <Ranking
              title="Articles les plus lus"
              items={topArticles}
              empty="Aucune vue d’article pour l’instant."
            />
            <Ranking
              title="Épisodes les plus consultés"
              items={topEpisodes}
              empty="Aucune vue d’épisode pour l’instant."
            />
          </div>
        )}
      </section>
    </div>
  )
}
