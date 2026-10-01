import { getCurrentUser } from '@/lib/session'
import AccountBar from '@/components/admin/AccountBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <>
      {user && <AccountBar name={user.name} email={user.email} />}
      {children}
    </>
  )
}
