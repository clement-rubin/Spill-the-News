import Link from 'next/link'

interface Props {
  article: {
    slug: string
    title: string
    category: string
    coverImage: string | null
    publishedAt: Date
  }
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`} className="card">
      <div className={`card-media${article.coverImage ? '' : ' card-media--empty'}`}>
        {article.coverImage ? (
          <img src={article.coverImage} alt="" />
        ) : (
          <span aria-hidden>{article.title.charAt(0)}</span>
        )}
      </div>
      <div className="card-body">
        <span className="tag">{article.category}</span>
        <h3>{article.title}</h3>
        <span className="card-meta">
          {article.publishedAt.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </Link>
  )
}
