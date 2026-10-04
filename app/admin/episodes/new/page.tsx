import Link from 'next/link'
import EpisodeForm from '@/components/admin/EpisodeForm'
import { getCurrentUser } from '@/lib/session'
import { getAuthors } from '@/lib/users'
import { createEpisodeAction } from '../actions'

export const metadata = { title: 'Nouvel épisode — Spill the News' }

export default async function NewEpisodePage() {
  const [authors, user] = await Promise.all([getAuthors(), getCurrentUser()])

  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Podcast</span>
        <h1>Nouvel épisode</h1>
      </header>

      <EpisodeForm
        action={createEpisodeAction}
        authors={authors}
        defaultAuthorId={user?.id ?? ''}
      />
    </div>
  )
}
