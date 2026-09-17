import Link from 'next/link'

interface Props {
  article: { slug: string; title: string; category: string; coverImage: string | null; publishedAt: Date }
}

export default function ArticleCard({ article }: Props) {
  return (
    <Link href={`/articles/${article.slug}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {article.coverImage && <img src={article.coverImage} alt="" />}
      <span className="tag">{article.category}</span>
      <h3>{article.title}</h3>
      <small>{article.publishedAt.toLocaleDateString('fr-FR')}</small>
    </Link>
  )
}
