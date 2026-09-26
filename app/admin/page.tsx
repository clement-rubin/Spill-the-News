import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'

export const metadata = { title: 'Tableau de bord — Spill the News' }

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminDashboard() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <div>
          <span className="kicker">Espace contributeurs</span>
          <h1>Tableau de bord</h1>
        </div>
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
