'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)

    const supabase = createBrowserSupabase()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setPending(false)
    // Always the same message — revealing whether an account exists is a
    // privacy leak Supabase deliberately avoids, and so do we.
    setSent(true)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Mot de passe oublié</h1>
        <p>Reçois un lien par email pour en choisir un nouveau.</p>

        {sent ? (
          <p className="form-success" role="status">
            Si ce compte existe, un email vient de partir.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" disabled={pending}>
              {pending ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          <Link href="/admin/login">Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
