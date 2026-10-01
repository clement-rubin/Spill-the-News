'use client'

import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase/client'

export default function AccountBar({ name, email }: { name: string | null; email: string | null }) {
  async function handleLogout() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    // A relative navigation, not a NEXTAUTH_URL-derived absolute one — this
    // is the fix for logout landing on the wrong origin/port.
    window.location.assign('/admin/login')
  }

  return (
    <div className="account-bar">
      <div className="account-bar-inner">
        <Link href="/admin/account" className="account-bar-user">
          {name || email || 'Mon compte'}
        </Link>
        <button type="button" className="account-bar-logout" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
