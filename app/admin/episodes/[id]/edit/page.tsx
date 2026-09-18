import Link from 'next/link'
import { notFound } from 'next/navigation'
import EpisodeForm from '@/components/admin/EpisodeForm'
import { getEpisodeById } from '@/lib/episodes'
import { updateEpisodeAction, deleteEpisodeAction } from '../../actions'

export const metadata = { title: 'Modifier un épisode — Spill the News' }

export default async function EditEpisodePage({ params }: { params: { id: string } }) {
  const episode = await getEpisodeById(params.id)
  if (!episode) notFound()

  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Podcast</span>
        <h1>Modifier</h1>
      </header>

      <EpisodeForm action={updateEpisodeAction} episode={episode} />

      <form action={deleteEpisodeAction} className="danger-zone">
        <input type="hidden" name="id" value={episode.id} />
        <div>
          <h2>Supprimer cet épisode</h2>
          <p>Définitif. L’épisode disparaît du site immédiatement.</p>
        </div>
        <button type="submit" className="btn btn--danger">
          Supprimer
        </button>
      </form>
    </div>
  )
}
