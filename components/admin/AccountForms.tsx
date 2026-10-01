'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { FormState } from '@/app/admin/account/actions'

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  )
}

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="form-error" role="alert">{state.error}</p>
  if (state.success) return <p className="form-success" role="status">{state.success}</p>
  return null
}

export function ProfileForm({ action, name }: { action: Action; name: string }) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="name">Nom</label>
        <input id="name" name="name" className="input" defaultValue={name} required />
      </div>
      <Feedback state={state} />
      <div className="form-actions">
        <SubmitButton label="Enregistrer" pendingLabel="Enregistrement…" />
      </div>
    </form>
  )
}

export function PasswordForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, {})

  return (
    <form action={formAction} className="form">
      <div className="field">
        <label htmlFor="currentPassword">Mot de passe actuel</label>
        <input id="currentPassword" name="currentPassword" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="newPassword">Nouveau mot de passe</label>
        <input id="newPassword" name="newPassword" type="password" className="input" autoComplete="new-password" minLength={6} required />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
        <input id="confirmPassword" name="confirmPassword" type="password" className="input" autoComplete="new-password" minLength={6} required />
      </div>
      <Feedback state={state} />
      <div className="form-actions">
        <SubmitButton label="Changer le mot de passe" pendingLabel="Mise à jour…" />
      </div>
    </form>
  )
}
