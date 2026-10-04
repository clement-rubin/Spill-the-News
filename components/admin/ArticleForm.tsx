'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import CoverField from './CoverField'
import RichTextField from './RichTextField'
import type { FormState } from '@/app/admin/articles/actions'
import type { AuthorOption } from '@/lib/users'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

interface Props {
  action: Action
  authors: AuthorOption[]
  defaultAuthorId: string
  article?: {
    id: string
    title: string
    category: string
    body: string
    coverImage: string | null
  }
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Enregistrement…' : label}
    </button>
  )
}

export default function ArticleForm({ action, authors, defaultAuthorId, article }: Props) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="form">
      {article && <input type="hidden" name="id" value={article.id} />}

      <div className="field">
        <label htmlFor="title">Titre</label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={article?.title}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="category">Catégorie</label>
        <input
          id="category"
          name="category"
          className="input"
          placeholder="Politique, Médias, Géopolitique, Économie, Culture, Littérature, Enjeux sociétaux"
          defaultValue={article?.category}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="authorId">Auteur</label>
        <select
          id="authorId"
          name="authorId"
          className="input"
          defaultValue={defaultAuthorId}
          required
        >
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
        <p className="field-hint">Nom affiché sous le titre de l&apos;article.</p>
      </div>

      <CoverField defaultValue={article?.coverImage ?? null} />

      <div className="field">
        <label htmlFor="body">Contenu</label>
        <RichTextField id="body" name="body" defaultValue={article?.body} />
        <p className="field-hint">
          Utilisez la barre d&apos;outils pour mettre en gras, souligner, changer la police,
          insérer un lien, une citation ou aligner/justifier un passage. Markdown accepté aussi : <code>## Titre</code>, <code>**gras**</code>,{' '}
          <code>[lien](https://…)</code>.
        </p>
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        <SubmitButton label={article ? 'Enregistrer' : 'Publier'} />
        <Link href="/admin" className="btn btn--ghost">
          Annuler
        </Link>
      </div>
    </form>
  )
}
