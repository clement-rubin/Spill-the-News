'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/authErrors'

export default function SignupPage() {
  const router = useRouter()
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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setPending(false)
      setError(mapAuthError(signUpError))
      return
    }

    // With "Confirm email" off in Supabase, signUp logs the member in
    // immediately — a session comes back right away and there's nothing to
    // confirm. With it on, no session comes back yet; show the check-your-
    // email message instead. Same code path handles either setting.
    if (data.session) {
      router.push('/admin')
      router.refresh()
      return
    }

    setPending(false)
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
