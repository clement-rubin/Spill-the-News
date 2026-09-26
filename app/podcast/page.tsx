import { getEpisodes } from '@/lib/episodes'
import EpisodeCard from '@/components/EpisodeCard'

export const metadata = {
  title: 'Podcast — Spill the News',
  description: 'Tous les épisodes du podcast Spill the News.',
}

export default async function PodcastPage() {
  const episodes = await getEpisodes()

  return (
    <>
      <header className="page-head">
        <span className="kicker">À écouter</span>
        <h1>Podcast</h1>
        <p>
          Nos conversations, en version longue. Disponible sur Spotify.
        </p>
      </header>

      <section className="section">
        {episodes.length > 0 ? (
          <div className="grid" data-reveal data-reveal-stagger>
            {episodes.map((episode) => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>
        ) : (
          <div className="empty" data-reveal>
            <strong>Aucun épisode pour l&apos;instant</strong>
            Le premier enregistrement arrive.
          </div>
        )}
      </section>
    </>
  )
}
