import { notFound } from 'next/navigation'
import { getEpisodeById } from '@/lib/episodes'

export default async function EpisodeDetailPage({ params }: { params: { id: string } }) {
  const episode = await getEpisodeById(params.id)
  if (!episode) notFound()

  return (
    <article>
      {episode.coverImage && <img src={episode.coverImage} alt="" style={{ width: '100%', borderRadius: '1rem' }} />}
      <h1>{episode.title}</h1>
      <small>Par {episode.author.name} — {episode.publishedAt.toLocaleDateString('fr-FR')}</small>
      <p>{episode.description}</p>
      <a href={episode.externalLink} target="_blank" rel="noopener noreferrer" className="tag">
        Écouter l'épisode →
      </a>
    </article>
  )
}
