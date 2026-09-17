import Link from 'next/link'

interface Props {
  episode: { id: string; title: string; description: string; coverImage: string | null; publishedAt: Date }
}

export default function EpisodeCard({ episode }: Props) {
  return (
    <Link href={`/podcast/${episode.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
      {episode.coverImage && <img src={episode.coverImage} alt="" />}
      <h3>{episode.title}</h3>
      <p>{episode.description}</p>
      <small>{episode.publishedAt.toLocaleDateString('fr-FR')}</small>
    </Link>
  )
}
