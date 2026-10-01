'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { mapAuthError } from '@/lib/authErrors'

export interface FormState {
  error?: string
  success?: string
}

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return user
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const name = String(formData.get('name') ?? '').trim()

  if (!name) return { error: 'Le nom est obligatoire.' }

  const [{ error: profileError }, { error: metaError }] = await Promise.all([
    supabase.from('users').update({ name }).eq('id', user.id),
    supabase.auth.admin.updateUserById(user.id, { user_metadata: { name } }),
  ])
  if (profileError || metaError) return { error: 'Mise à jour impossible.' }

  revalidatePath('/admin/account')
  return { success: 'Profil mis à jour.' }
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (newPassword.length < 6) return { error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' }
  if (newPassword !== confirmPassword) return { error: 'Les mots de passe ne correspondent pas.' }

  // A throwaway, non-persisting client just to verify the current password —
  // it must never touch the active session's cookies.
  const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) return { error: 'Mot de passe actuel incorrect.' }

  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (error) return { error: mapAuthError(error) }

  return { success: 'Mot de passe mis à jour.' }
}
