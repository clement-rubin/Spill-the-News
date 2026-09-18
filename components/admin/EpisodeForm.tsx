'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { FormState } from '@/app/admin/episodes/actions'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

interface Props {
  action: Action
  episode?: {
    id: string
    title: string
    description: string
    externalLink: string
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

export default function EpisodeForm({ action, episode }: Props) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="form">
      {episode && <input type="hidden" name="id" value={episode.id} />}

      <div className="field">
        <label htmlFor="title">Titre</label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={episode?.title}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="externalLink">Lien d’écoute</label>
        <input
          id="externalLink"
          name="externalLink"
          className="input"
          type="url"
          placeholder="https://open.spotify.com/…"
          defaultValue={episode?.externalLink}
          required
        />
        <p className="field-hint">Spotify, Apple Podcasts ou YouTube.</p>
      </div>

      <div className="field">
        <label htmlFor="coverImage">Image de couverture</label>
        <input
          id="coverImage"
          name="coverImage"
          className="input"
          type="url"
          placeholder="https://…"
          defaultValue={episode?.coverImage ?? ''}
        />
        <p className="field-hint">Optionnel.</p>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          className="textarea textarea--short"
          defaultValue={episode?.description}
          required
        />
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="form-actions">
        <SubmitButton label={episode ? 'Enregistrer' : 'Publier'} />
        <Link href="/admin" className="btn btn--ghost">
          Annuler
        </Link>
      </div>
    </form>
  )
}
