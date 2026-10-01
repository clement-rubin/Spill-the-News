import { createServerSupabase } from './supabase/server'
import { supabase as serviceSupabase } from './supabase'

export interface CurrentUser {
  id: string
  email: string
  name: string
}

/**
 * The display name lives in public.users (synced from auth.users by a
 * database trigger on signup), not in the JWT, so a rename made in
 * /admin/account is reflected immediately on the next request instead of
 * staying stale until the next login.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: profile } = await serviceSupabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  return {
    id: user.id,
    email: user.email,
    name: profile?.name ?? (user.user_metadata?.name as string | undefined) ?? user.email,
  }
}
