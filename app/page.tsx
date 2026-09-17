import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'
import ArticleCard from '@/components/ArticleCard'
import EpisodeCard from '@/components/EpisodeCard'

export default async function HomePage() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])
  const latestArticles = articles.slice(0, 3)
  const latestEpisodes = episodes.slice(0, 2)

  return (
    <>
      <h1>Spill the News</h1>
      <p>Newsletter étudiante — culture, arts et société, racontées par des étudiants.</p>

      <h2>Derniers articles</h2>
      {latestArticles.map((a) => <ArticleCard key={a.id} article={a} />)}

      <h2>Derniers épisodes</h2>
      {latestEpisodes.map((e) => <EpisodeCard key={e.id} episode={e} />)}
    </>
  )
}
