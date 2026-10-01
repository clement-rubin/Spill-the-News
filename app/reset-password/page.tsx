import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import ResetPasswordForm from '@/components/ResetPasswordForm'

export const metadata = { title: 'Nouveau mot de passe — Spill the News' }

export default async function ResetPasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/forgot-password')

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Nouveau mot de passe</h1>
        <p>Choisis un nouveau mot de passe pour {user.email}.</p>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
