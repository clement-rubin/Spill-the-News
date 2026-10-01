'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'

export default function AccountBar({ name, email }: { name: string | null; email: string | null }) {
  return (
    <div className="account-bar">
      <div className="account-bar-inner">
        <Link href="/admin/account" className="account-bar-user">
          {name || email || 'Mon compte'}
        </Link>
        <button
          type="button"
          className="account-bar-logout"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
        >
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
