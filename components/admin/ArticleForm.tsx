'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { FormState } from '@/app/admin/articles/actions'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

interface Props {
  action: Action
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

export default function ArticleForm({ action, article }: Props) {
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
        <label htmlFor="coverImage">Image de couverture</label>
        <input
          id="coverImage"
          name="coverImage"
          className="input"
          type="url"
          placeholder="https://…"
          defaultValue={article?.coverImage ?? ''}
        />
        <p className="field-hint">Optionnel. Collez l’adresse d’une image.</p>
      </div>

      <div className="field">
        <label htmlFor="body">Contenu</label>
        <textarea
          id="body"
          name="body"
          className="textarea"
          defaultValue={article?.body}
          required
        />
        <p className="field-hint">
          Markdown accepté : <code>## Titre</code>, <code>**gras**</code>,{' '}
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
