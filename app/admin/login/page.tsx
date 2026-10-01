'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/authErrors'

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(
    searchParams.get('error') === 'link_expired' ? 'Ce lien a expiré, redemande-en un.' : ''
  )
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setUnconfirmed(false)
    setResent(false)
    setPending(true)

    const supabase = createBrowserSupabase()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setPending(false)

    if (signInError) {
      if (signInError.code === 'email_not_confirmed') setUnconfirmed(true)
      setError(mapAuthError(signInError))
      return
    }

    router.push('/admin')
    router.refresh()
  }

  async function handleResend() {
    const supabase = createBrowserSupabase()
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p>Espace contributeurs de Spill the News.</p>

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

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          {unconfirmed && (
            <p className="form-error" role="alert">
              {resent ? (
                'Email renvoyé, vérifie ta boîte mail.'
              ) : (
                <button type="button" className="auth-inline-btn" onClick={handleResend}>
                  Renvoyer l&apos;email de confirmation
                </button>
              )}
            </p>
          )}

          <button type="submit" className="btn" disabled={pending}>
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link href="/signup">Créez-en un</Link>
        </p>
        <p className="auth-switch">
          <Link href="/forgot-password">Mot de passe oublié ?</Link>
        </p>

        <div className="auth-tuto">
          <h2>Comment rejoindre l&apos;équipe ?</h2>
          <ol>
            <li>Cliquez sur « Créez-en un » ci-dessus pour ouvrir le formulaire d&apos;inscription.</li>
            <li>Renseignez votre nom, votre email et un mot de passe (6 caractères minimum).</li>
            <li>Confirmez votre adresse via le lien reçu par email, puis connectez-vous.</li>
            <li>Chaque article que vous publiez affiche votre nom comme auteur, visible sur sa page.</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
