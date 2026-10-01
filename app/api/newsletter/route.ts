import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email'
import { renderNewsletterEmail } from '@/lib/newsletterTemplate'
import { unsubscribeUrl } from '@/lib/unsubscribe'

// Supabase table required:
//   CREATE TABLE newsletter_subscriptions (
//     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     email text UNIQUE NOT NULL,
//     created_at timestamptz NOT NULL DEFAULT now()
//   );

export async function POST(request: Request) {
  let email: string
  try {
    const body = await request.json()
    email = (body.email ?? '').toString().trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }

  const { error } = await supabase
    .from('newsletter_subscriptions')
    .upsert({ email }, { onConflict: 'email' })

  if (error) {
    console.error('newsletter upsert:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }

  // The subscription is already saved, so a failed confirmation email
  // never turns into a failed subscription for the visitor.
  await sendEmail({
    to: email,
    subject: 'Bienvenue dans la newsletter Spill the News',
    html: renderNewsletterEmail({
      title: "C'est confirmé ☕",
      bodyHtml:
        '<p>Merci de rejoindre la tasse du mercredi. Tu recevras nos prochains articles et épisodes directement dans ta boîte mail.</p>',
      unsubscribeHref: unsubscribeUrl(email),
    }),
  })

  return NextResponse.json({ ok: true })
}
