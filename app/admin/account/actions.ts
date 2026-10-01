'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { hashPassword, verifyPassword } from '@/lib/password'

export interface FormState {
  error?: string
  success?: string
}

async function requireUserId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/admin/login')
  return session.user.id
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId()
  const name = String(formData.get('name') ?? '').trim()

  if (!name) return { error: 'Le nom est obligatoire.' }

  const { error } = await supabase.from('users').update({ name }).eq('id', userId)
  if (error) return { error: 'Mise à jour impossible.' }

  revalidatePath('/admin/account')
  return { success: 'Profil mis à jour.' }
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId()
  const currentPassword = String(formData.get('currentPassword') ?? '')
  const newPassword = String(formData.get('newPassword') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (newPassword.length < 6) return { error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' }
  if (newPassword !== confirmPassword) return { error: 'Les mots de passe ne correspondent pas.' }

  const { data: user } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .maybeSingle()

  if (!user) return { error: 'Compte introuvable.' }

  const valid = await verifyPassword(currentPassword, user.password_hash)
  if (!valid) return { error: 'Mot de passe actuel incorrect.' }

  const password_hash = await hashPassword(newPassword)
  const { error } = await supabase.from('users').update({ password_hash }).eq('id', userId)
  if (error) return { error: 'Mise à jour impossible.' }

  return { success: 'Mot de passe mis à jour.' }
}
