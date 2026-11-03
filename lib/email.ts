import nodemailer, { type Transporter } from 'nodemailer'

interface SendEmailInput {
  to: string
  subject: string
  html: string
}

const DEFAULT_FROM_NAME = 'Spill the News'

let transporter: Transporter | null | undefined

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  // A pooled connection is reused across the per-subscriber sends of one
  // newsletter issue instead of opening a new SMTP session for each email.
  transporter =
    user && pass
      ? nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          pool: true,
          auth: { user, pass },
        })
      : null
  return transporter
}

/**
 * Best-effort send through Gmail SMTP: missing GMAIL_USER /
 * GMAIL_APP_PASSWORD or a provider error never throws, since newsletter
 * emails are a side effect, not the operation the caller is actually
 * performing (a signup, a subscription, a send).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const smtp = getTransporter()

  if (!smtp) {
    console.warn('sendEmail skipped: GMAIL_USER or GMAIL_APP_PASSWORD not configured')
    return { ok: false, error: 'not_configured' }
  }

  try {
    await smtp.sendMail({
      from: { name: process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME, address: process.env.GMAIL_USER! },
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
    return { ok: true }
  } catch (error) {
    console.error('sendEmail failed:', error)
    return { ok: false, error: error instanceof Error ? error.message : 'unknown' }
  }
}
