import Link from 'next/link'
import EpisodeForm from '@/components/admin/EpisodeForm'
import { createEpisodeAction } from '../actions'

export const metadata = { title: 'Nouvel épisode — Spill the News' }

export default function NewEpisodePage() {
  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Podcast</span>
        <h1>Nouvel épisode</h1>
      </header>

      <EpisodeForm action={createEpisodeAction} />
    </div>
  )
}
