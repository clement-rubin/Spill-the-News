import Link from 'next/link'
import ArticleForm from '@/components/admin/ArticleForm'
import { getCurrentUser } from '@/lib/session'
import { getAuthors } from '@/lib/users'
import { createArticleAction } from '../actions'

export const metadata = { title: 'Nouvel article — Spill the News' }

export default async function NewArticlePage() {
  const [authors, user] = await Promise.all([getAuthors(), getCurrentUser()])

  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Article</span>
        <h1>Nouvel article</h1>
      </header>

      <ArticleForm
        action={createArticleAction}
        authors={authors}
        defaultAuthorId={user?.id ?? ''}
      />
    </div>
  )
}
