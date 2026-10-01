import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { updateProfileAction, changePasswordAction } from './actions'
import { ProfileForm, PasswordForm } from '@/components/admin/AccountForms'

export const metadata = { title: 'Mon compte — Spill the News' }

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="admin-shell">
      <div className="admin-head">
        <div>
          <span className="kicker">Espace contributeurs</span>
          <h1>Mon compte</h1>
        </div>
        <Link href="/admin" className="btn btn--ghost btn--sm">
          ← Tableau de bord
        </Link>
      </div>

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Profil</h2>
            <p className="section-count">{user.email}</p>
          </div>
        </div>
        <ProfileForm action={updateProfileAction} name={user.name} />
      </section>

      <section className="admin-section">
        <div className="section-head">
          <div>
            <h2>Mot de passe</h2>
          </div>
        </div>
        <PasswordForm action={changePasswordAction} />
      </section>
    </div>
  )
}
