import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { getArticleBySlug } from '@/lib/articles'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) return { title: 'Article introuvable — Spill the News' }
  return { title: `${article.title} — Spill the News` }
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()

  return (
    <div className="detail-page">
    <article className="detail">
      <Link href="/articles" className="detail-back">
        <span aria-hidden>←</span> Tous les articles
      </Link>

      <header className="detail-head">
        <span className="tag">{article.category}</span>
        <h1>{article.title}</h1>
        <div className="detail-meta">
          <span>Par {article.author.name}</span>
          <span className="dot" aria-hidden />
          <time dateTime={article.publishedAt.toISOString()}>
            {article.publishedAt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </div>
      </header>

      {article.coverImage && (
        <div className="detail-cover">
          <img src={article.coverImage} alt="" />
        </div>
      )}

      {/* marked.parse does not sanitize — safe only because article.body is admin-authored, not public input */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(article.body) }} />
    </article>
    </div>
  )
}
