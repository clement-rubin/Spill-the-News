import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'

/** Deletes the subscription if the link is genuine; returns the email, or null for a bad link. */
async function unsubscribe(request: Request): Promise<string | null> {
  const { searchParams } = new URL(request.url)
  const email = (searchParams.get('email') ?? '').trim().toLowerCase()
  const token = searchParams.get('token') ?? ''

  if (!email || !token || !verifyUnsubscribeToken(email, token)) return null

  await supabase.from('newsletter_subscriptions').delete().eq('email', email)
  return email
}

// Clicking "Se désabonner" in the email.
export async function GET(request: Request) {
  const email = await unsubscribe(request)
  if (!email) return new NextResponse('Lien de désabonnement invalide.', { status: 400 })

  return new NextResponse(
    `<!DOCTYPE html><html lang="fr"><body style="font-family:Georgia,serif;padding:3rem;text-align:center;">
      <h1>Tu es désabonné·e</h1>
      <p>${email} ne recevra plus la newsletter Spill the News.</p>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

// One-click unsubscribe (RFC 8058): Gmail's own "Se désabonner" button
// POSTs to the List-Unsubscribe URL with no page shown to the reader.
export async function POST(request: Request) {
  const email = await unsubscribe(request)
  if (!email) return NextResponse.json({ error: 'Lien de désabonnement invalide.' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
