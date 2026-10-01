'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/authErrors'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setPending(true)
    const supabase = createBrowserSupabase()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setPending(false)

    if (updateError) {
      setError(mapAuthError(updateError))
      return
    }

    router.push('/admin')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="password">Nouveau mot de passe</label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="confirm">Confirmer le nouveau mot de passe</label>
        <input
          id="confirm"
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn" disabled={pending}>
        {pending ? 'Mise à jour…' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}
