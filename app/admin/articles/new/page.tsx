import Link from 'next/link'
import ArticleForm from '@/components/admin/ArticleForm'
import { createArticleAction } from '../actions'

export const metadata = { title: 'Nouvel article — Spill the News' }

export default function NewArticlePage() {
  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Article</span>
        <h1>Nouvel article</h1>
      </header>

      <ArticleForm action={createArticleAction} />
    </div>
  )
}
