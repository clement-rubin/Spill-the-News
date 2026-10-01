import { Resend } from 'resend'

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

let client: Resend | null | undefined

function getClient(): Resend | null {
  if (client !== undefined) return client
  const apiKey = process.env.RESEND_API_KEY
  client = apiKey ? new Resend(apiKey) : null
  return client
}

/**
 * Best-effort send: a missing RESEND_API_KEY or a provider error never
 * throws, since newsletter emails are a side effect, not the operation
 * the caller is actually performing (a signup, a subscription, a send).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient()
  const from = process.env.RESEND_FROM_EMAIL

  if (!resend || !from) {
    console.warn('sendEmail skipped: RESEND_API_KEY or RESEND_FROM_EMAIL not configured')
    return { ok: false, error: 'not_configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
    if (error) {
      console.error('sendEmail failed:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (error) {
    console.error('sendEmail failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}
