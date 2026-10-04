import { supabase } from './supabase'

export interface AuthorOption {
  id: string
  name: string
}

/** Every account that can sign an article, for the author picker. */
export async function getAuthors(): Promise<AuthorOption[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row: { id: string; name: string | null; email: string }) => ({
    id: row.id,
    name: row.name?.trim() || row.email,
  }))
}

export async function authorExists(id: string): Promise<boolean> {
  const { data } = await supabase.from('users').select('id').eq('id', id).maybeSingle()
  return Boolean(data)
}
