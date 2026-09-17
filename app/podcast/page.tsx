import { getEpisodes } from '@/lib/episodes'
import EpisodeCard from '@/components/EpisodeCard'

export default async function PodcastPage() {
  const episodes = await getEpisodes()
  return (
    <>
      <h1>Podcast</h1>
      {episodes.length === 0 && <p>Aucun épisode pour l'instant.</p>}
      {episodes.map((e) => <EpisodeCard key={e.id} episode={e} />)}
    </>
  )
}
