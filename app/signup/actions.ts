'use server'

import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'

export interface SignupResult {
  error?: string
}

export async function signupAction(input: {
  name: string
  email: string
  password: string
}): Promise<SignupResult> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!name) return { error: 'Le nom est obligatoire.' }
  if (!email) return { error: "L'email est obligatoire." }
  if (password.length < 6) return { error: 'Le mot de passe doit faire au moins 6 caractères.' }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: 'Cet email est déjà utilisé.' }

  const password_hash = await hashPassword(password)

  const { error } = await supabase.from('users').insert({ name, email, password_hash })

  if (error) return { error: 'Création du compte impossible.' }

  return {}
}
