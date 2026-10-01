import crypto from 'crypto'

function secret(): string {
  return process.env.NEXTAUTH_SECRET ?? ''
}

export function unsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', secret()).update(email.toLowerCase()).digest('hex')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = unsubscribeToken(email)
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const token = unsubscribeToken(email)
  const params = new URLSearchParams({ email, token })
  return `${base}/api/newsletter/unsubscribe?${params.toString()}`
}
