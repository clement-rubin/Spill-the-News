import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEpisodeById } from '@/lib/episodes'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const episode = await getEpisodeById(params.id)
  if (!episode) return { title: 'Épisode introuvable — Spill the News' }
  return { title: `${episode.title} — Spill the News` }
}

export default async function EpisodeDetailPage({ params }: { params: { id: string } }) {
  const episode = await getEpisodeById(params.id)
  if (!episode) notFound()

  return (
    <article className="detail">
      <Link href="/podcast" className="detail-back">
        <span aria-hidden>←</span> Tous les épisodes
      </Link>

      <header className="detail-head">
        <span className="tag">Épisode</span>
        <h1>{episode.title}</h1>
        <div className="detail-meta">
          <span>Par {episode.author.name}</span>
          <span className="dot" aria-hidden />
          <time dateTime={episode.publishedAt.toISOString()}>
            {episode.publishedAt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
        </div>
      </header>

      {episode.coverImage && (
        <div className="detail-cover">
          <img src={episode.coverImage} alt="" />
        </div>
      )}

      <div className="prose">
        <p>{episode.description}</p>
      </div>

      <div className="listen-panel">
        <h2>Écouter l&apos;épisode</h2>
        <p>Disponible sur ta plateforme habituelle.</p>
        <a
          href={episode.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--invert"
        >
          Lancer l&apos;écoute <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  )
}
