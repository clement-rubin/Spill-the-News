import { getArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'

export default async function ArticlesPage() {
  const articles = await getArticles()
  return (
    <>
      <h1>Articles</h1>
      {articles.length === 0 && <p>Aucun article pour l'instant.</p>}
      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
    </>
  )
}
