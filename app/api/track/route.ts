import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Supabase table required:
//   CREATE TABLE page_views (
//     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     path text NOT NULL,
//     created_at timestamptz NOT NULL DEFAULT now()
//   );

export async function POST(request: Request) {
  let path: string
  try {
    const body = await request.json()
    path = (body.path ?? '').toString().trim().slice(0, 300)
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  if (!path) return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 })

  const { error } = await supabase.from('page_views').insert({ path })

  // A dropped view never breaks the visitor's page, so this always 200s.
  if (error) console.error('page_views insert:', error)
  return NextResponse.json({ ok: true })
}
