import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { updateProfileAction, changePasswordAction } from './actions'
import { ProfileForm, PasswordForm } from '@/components/admin/AccountForms'

export const metadata = { title: 'Mon compte — Spill the News' }

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/admin/login')

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
            <p className="section-count">{session.user.email}</p>
          </div>
        </div>
        <ProfileForm action={updateProfileAction} name={session.user.name ?? ''} />
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
