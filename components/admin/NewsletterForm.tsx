'use client'

import { useFormState, useFormStatus } from 'react-dom'
import RichTextField from './RichTextField'
import type { FormState } from '@/app/admin/newsletter/actions'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? 'Envoi…' : 'Envoyer'}
    </button>
  )
}

export default function NewsletterForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="subject">Sujet</label>
        <input id="subject" name="subject" className="input" required />
      </div>

      <div className="field">
        <label htmlFor="body">Contenu</label>
        <RichTextField id="body" name="body" />
      </div>

      <div className="field">
        <label htmlFor="scheduledAt">Programmer pour (optionnel)</label>
        <input id="scheduledAt" name="scheduledAt" type="datetime-local" className="input" />
        <p className="field-hint">Laisse vide pour envoyer immédiatement à tous les abonnés.</p>
      </div>

      <div className="field">
        <label htmlFor="recurrence">Récurrence</label>
        <select id="recurrence" name="recurrence" className="input" defaultValue="none">
          <option value="none">Aucune — envoi unique</option>
          <option value="weekly">Toutes les semaines</option>
          <option value="monthly">Tous les mois</option>
        </select>
        <p className="field-hint">
          Renvoie automatiquement le même contenu à chaque échéance, tant qu&apos;elle n&apos;est pas
          arrêtée depuis l&apos;historique ci-dessous.
        </p>
      </div>

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}

      <div className="form-actions">
        <SubmitButton />
      </div>
    </form>
  )
}
