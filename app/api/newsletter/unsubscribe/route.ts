import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = (searchParams.get('email') ?? '').trim().toLowerCase()
  const token = searchParams.get('token') ?? ''

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new NextResponse('Lien de désabonnement invalide.', { status: 400 })
  }

  await supabase.from('newsletter_subscriptions').delete().eq('email', email)

  return new NextResponse(
    `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;padding:3rem;text-align:center;">
      <h1>Tu es désabonné·e</h1>
      <p>${email} ne recevra plus la newsletter Spill the News.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
