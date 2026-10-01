import { marked } from 'marked'
import { supabase } from './supabase'
import { sendEmail } from './email'
import { renderNewsletterEmail } from './newsletterTemplate'
import { unsubscribeUrl } from './unsubscribe'

// Supabase table required:
//   CREATE TABLE newsletter_issues (
//     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     subject text NOT NULL,
//     body text NOT NULL,
//     status text NOT NULL DEFAULT 'draft',
//     scheduled_at timestamptz,
//     recurrence text,
//     last_sent_at timestamptz,
//     created_at timestamptz NOT NULL DEFAULT now()
//   );

export type Recurrence = 'none' | 'weekly' | 'monthly'

export interface NewsletterIssue {
  id: string
  subject: string
  body: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduledAt: Date | null
  recurrence: Recurrence
  lastSentAt: Date | null
  createdAt: Date
}

interface IssueRow {
  id: string
  subject: string
  body: string
  status: 'draft' | 'scheduled' | 'sent'
  scheduled_at: string | null
  recurrence: string | null
  last_sent_at: string | null
  created_at: string
}

function mapIssue(row: IssueRow): NewsletterIssue {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : null,
    recurrence: (row.recurrence as Recurrence) ?? 'none',
    lastSentAt: row.last_sent_at ? new Date(row.last_sent_at) : null,
    createdAt: new Date(row.created_at),
  }
}

const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205'])

export async function getNewsletterIssues(): Promise<{ issues: NewsletterIssue[]; tableMissing: boolean }> {
  const { data, error } = await supabase
    .from('newsletter_issues')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    if (MISSING_TABLE_CODES.has(error.code)) return { issues: [], tableMissing: true }
    throw error
  }

  return { issues: (data ?? []).map((r) => mapIssue(r as IssueRow)), tableMissing: false }
}

export async function createIssue(input: {
  subject: string
  body: string
  status: 'scheduled' | 'sent'
  scheduledAt: Date | null
  recurrence: Recurrence
}): Promise<NewsletterIssue> {
  const { data, error } = await supabase
    .from('newsletter_issues')
    .insert({
      subject: input.subject,
      body: input.body,
      status: input.status,
      scheduled_at: input.scheduledAt ? input.scheduledAt.toISOString() : null,
      recurrence: input.recurrence === 'none' ? null : input.recurrence,
      last_sent_at: input.status === 'sent' ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapIssue(data as IssueRow)
}

export async function markIssueSent(id: string): Promise<void> {
  const { error } = await supabase
    .from('newsletter_issues')
    .update({ status: 'sent', last_sent_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteIssue(id: string): Promise<void> {
  const { error } = await supabase.from('newsletter_issues').delete().eq('id', id)
  if (error) throw error
}

/** Sends one issue to every current subscriber. Best-effort per recipient. */
export async function dispatchIssue(subject: string, body: string): Promise<{ sent: number; failed: number }> {
  const { data: subscribers, error } = await supabase.from('newsletter_subscriptions').select('email')
  if (error) throw error

  const bodyHtml = marked.parse(body) as string
  let sent = 0
  let failed = 0

  for (const { email } of subscribers ?? []) {
    const result = await sendEmail({
      to: email,
      subject,
      html: renderNewsletterEmail({ title: subject, bodyHtml, unsubscribeHref: unsubscribeUrl(email) }),
    })
    if (result.ok) sent++
    else failed++
  }

  return { sent, failed }
}

export function nextOccurrence(from: Date, recurrence: Recurrence): Date {
  const next = new Date(from)
  if (recurrence === 'weekly') next.setDate(next.getDate() + 7)
  else if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1)
  return next
}
