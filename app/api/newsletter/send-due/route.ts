import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dispatchIssue, nextOccurrence, type Recurrence } from '@/lib/newsletterIssues'

// Trigger this route periodically (e.g. every hour) from an external
// scheduler — cron-job.org, a GitHub Actions scheduled workflow, or a
// Netlify scheduled function — with header `x-cron-secret: <CRON_SECRET>`.
// It sends scheduled issues once they're due, and resends recurring
// issues (weekly/monthly) once their next occurrence is due.

const DAY_MS = 24 * 60 * 60 * 1000

function isDue(lastSentAt: string, recurrence: Recurrence): boolean {
  const next = nextOccurrence(new Date(lastSentAt), recurrence)
  return next.getTime() <= Date.now()
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('x-cron-secret') !== secret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const results: { id: string; subject: string; sent: number; failed: number }[] = []

  const { data: scheduled } = await supabase
    .from('newsletter_issues')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date(Date.now() + DAY_MS).toISOString())

  for (const issue of scheduled ?? []) {
    if (new Date(issue.scheduled_at).getTime() > Date.now()) continue
    const { sent, failed } = await dispatchIssue(issue.subject, issue.body)
    await supabase
      .from('newsletter_issues')
      .update({ status: 'sent', last_sent_at: new Date().toISOString() })
      .eq('id', issue.id)
    results.push({ id: issue.id, subject: issue.subject, sent, failed })
  }

  const { data: recurring } = await supabase
    .from('newsletter_issues')
    .select('*')
    .eq('status', 'sent')
    .not('recurrence', 'is', null)

  for (const issue of recurring ?? []) {
    if (!issue.last_sent_at || !isDue(issue.last_sent_at, issue.recurrence as Recurrence)) continue
    const { sent, failed } = await dispatchIssue(issue.subject, issue.body)
    await supabase.from('newsletter_issues').update({ last_sent_at: new Date().toISOString() }).eq('id', issue.id)
    results.push({ id: issue.id, subject: issue.subject, sent, failed })
  }

  return NextResponse.json({ ok: true, dispatched: results })
}
