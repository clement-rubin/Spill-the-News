import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { getArticleBySlug } from '@/lib/articles'

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug)
  if (!article) notFound()

  return (
    <article>
      {article.coverImage && <img src={article.coverImage} alt="" style={{ width: '100%', borderRadius: '1rem' }} />}
      <span className="tag">{article.category}</span>
      <h1>{article.title}</h1>
      <small>Par {article.author.name} — {article.publishedAt.toLocaleDateString('fr-FR')}</small>
      <div dangerouslySetInnerHTML={{ __html: marked.parse(article.body) }} />
    </article>
  )
}
