'use client'

import { useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import RichTextField from './RichTextField'
import type { FormState } from '@/app/admin/newsletter/actions'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

function SubmitButtons({ onIntent }: { onIntent: (intent: 'send' | 'test') => void }) {
  const { pending } = useFormStatus()
  return (
    <>
      <button type="submit" className="btn btn--ghost" disabled={pending} onClick={() => onIntent('test')}>
        Envoyer un test
      </button>
      <button type="submit" className="btn" disabled={pending} onClick={() => onIntent('send')}>
        {pending ? 'Envoi…' : 'Envoyer'}
      </button>
    </>
  )
}

export default function NewsletterForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, {})
  const intentRef = useRef<HTMLInputElement>(null)

  function setIntent(intent: 'send' | 'test') {
    if (intentRef.current) intentRef.current.value = intent
  }

  return (
    <form action={formAction} className="form">
      <input ref={intentRef} type="hidden" name="intent" defaultValue="send" />
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

      <div className="field">
        <label htmlFor="testEmail">Adresse de test</label>
        <input id="testEmail" name="testEmail" type="email" className="input" placeholder="toi@gmail.com" />
        <p className="field-hint">
          « Envoyer un test » envoie ce numéro uniquement à cette adresse, sans l&apos;enregistrer ni
          l&apos;envoyer aux abonnés.
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
        <SubmitButtons onIntent={setIntent} />
      </div>
    </form>
  )
}
