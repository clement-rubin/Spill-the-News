import Link from 'next/link'

interface Props {
  episode: {
    id: string
    title: string
    description: string
    coverImage: string | null
    publishedAt: Date
  }
}

export default function EpisodeCard({ episode }: Props) {
  return (
    <Link href={`/podcast/${episode.id}`} className="card">
      <div className={`card-media${episode.coverImage ? '' : ' card-media--empty'}`}>
        {episode.coverImage ? (
          <img src={episode.coverImage} alt="" />
        ) : (
          <span aria-hidden>{episode.title.charAt(0)}</span>
        )}
      </div>
      <div className="card-body">
        <span className="tag tag--muted">Épisode</span>
        <h3>{episode.title}</h3>
        <p>{episode.description}</p>
        <span className="card-meta">
          {episode.publishedAt.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </Link>
  )
}
