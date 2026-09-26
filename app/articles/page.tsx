import { getArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'

export const metadata = {
  title: 'Articles — Spill the News',
  description: 'Tous les articles de Spill the News.',
}

export default async function ArticlesPage() {
  const articles = await getArticles()

  return (
    <>
      <header className="page-head">
        <span className="kicker">Les écrits</span>
        <h1>Articles</h1>
        <p>Nos articles à découvrir en intégralité.</p>
      </header>

      <section className="section">
        {articles.length > 0 ? (
          <div className="grid" data-reveal data-reveal-stagger>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="empty" data-reveal>
            <strong>Aucun article pour l&apos;instant</strong>
            Reviens très vite, ça s&apos;écrit.
          </div>
        )}
      </section>
    </>
  )
}
