import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleForm from '@/components/admin/ArticleForm'
import { getArticleById } from '@/lib/articles'
import { updateArticleAction, deleteArticleAction } from '../../actions'

export const metadata = { title: 'Modifier un article — Spill the News' }

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleById(params.id)
  if (!article) notFound()

  return (
    <div className="admin-shell admin-shell--form">
      <Link href="/admin" className="detail-back">
        <span aria-hidden>←</span> Tableau de bord
      </Link>

      <header className="form-head">
        <span className="kicker">Article</span>
        <h1>Modifier</h1>
      </header>

      <ArticleForm action={updateArticleAction} article={article} />

      <form action={deleteArticleAction} className="danger-zone">
        <input type="hidden" name="id" value={article.id} />
        <div>
          <h2>Supprimer cet article</h2>
          <p>Définitif. L’article disparaît du site immédiatement.</p>
        </div>
        <button type="submit" className="btn btn--danger">
          Supprimer
        </button>
      </form>
    </div>
  )
}
