import Link from 'next/link'
import { getArticles } from '@/lib/articles'
import { getEpisodes } from '@/lib/episodes'

export default async function AdminDashboard() {
  const [articles, episodes] = await Promise.all([getArticles(), getEpisodes()])

  return (
    <>
      <h1>Tableau de bord</h1>

      <h2>Articles <Link href="/admin/articles/new" className="tag">+ Nouveau</Link></h2>
      <ul>
        {articles.map((a) => (
          <li key={a.id}>
            {a.title} — <Link href={`/admin/articles/${a.id}/edit`}>Éditer</Link>
          </li>
        ))}
      </ul>

      <h2>Épisodes <Link href="/admin/episodes/new" className="tag">+ Nouveau</Link></h2>
      <ul>
        {episodes.map((e) => (
          <li key={e.id}>
            {e.title} — <Link href={`/admin/episodes/${e.id}/edit`}>Éditer</Link>
          </li>
        ))}
      </ul>
    </>
  )
}
