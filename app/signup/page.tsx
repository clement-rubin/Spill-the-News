'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/authErrors'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setPending(false)

    if (signUpError) {
      setError(mapAuthError(signUpError))
      return
    }
    setSent(true)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Créer un compte</h1>
        <p>Rejoignez l&apos;espace contributeurs de Spill the News.</p>

        {sent ? (
          <p className="form-success" role="status">
            Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                className="input"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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

            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="btn" disabled={pending}>
              {pending ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Déjà un compte ? <Link href="/admin/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
