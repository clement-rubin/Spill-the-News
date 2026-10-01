import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { safeNext } from '@/lib/safeNext'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/admin/login?error=link_expired`)
}
