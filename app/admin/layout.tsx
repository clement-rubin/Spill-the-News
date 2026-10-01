import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AccountBar from '@/components/admin/AccountBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <>
      {session?.user && (
        <AccountBar name={session.user.name ?? null} email={session.user.email ?? null} />
      )}
      {children}
    </>
  )
}
