import { vi, describe, it, expect, beforeEach } from 'vitest'

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn()
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) }
})

vi.mock('nodemailer', () => ({ default: { createTransport } }))

const input = { to: 'reader@example.com', subject: 'Hello', html: '<p>Hi</p>' }

// The transporter is cached per module, so each test loads a fresh copy
// after setting the env vars it needs.
async function loadEmail() {
  vi.resetModules()
  return import('./email')
}

describe('htmlToText', () => {
  it('keeps paragraphs, list items and link targets', async () => {
    const { htmlToText } = await loadEmail()
    const html = `<html><head><style>p{}</style></head><body>
      <h1>Numéro 1</h1>
      <p>Salut &amp; bienvenue<br>à toi</p>
      <ul><li>Un</li><li>Deux</li></ul>
      <p><a href="https://site.test/unsub" style="x">Se désabonner</a></p>
    </body></html>`

    expect(htmlToText(html)).toBe(
      'Numéro 1\n\nSalut & bienvenue\nà toi\n\n- Un\n\n- Deux\n\nSe désabonner (https://site.test/unsub)',
    )
  })
})

describe('sendEmail', () => {
  beforeEach(() => {
    sendMail.mockReset()
    createTransport.mockClear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.GMAIL_USER = 'laure@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop'
    delete process.env.EMAIL_FROM_NAME
  })

  it('skips without connecting when not configured', async () => {
    delete process.env.GMAIL_APP_PASSWORD
    const { sendEmail } = await loadEmail()

    expect(await sendEmail(input)).toEqual({ ok: false, error: 'not_configured' })
    expect(createTransport).not.toHaveBeenCalled()
  })

  it('sends through Gmail SMTP with the app password', async () => {
    sendMail.mockResolvedValue({ messageId: '1' })
    const { sendEmail } = await loadEmail()

    expect(await sendEmail(input)).toEqual({ ok: true })
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'laure@gmail.com', pass: 'abcd efgh ijkl mnop' },
      }),
    )
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: 'Spill the News', address: 'laure@gmail.com' },
      to: 'reader@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
    })
  })

  it('adds one-click List-Unsubscribe headers when given an unsubscribe URL', async () => {
    sendMail.mockResolvedValue({ messageId: '1' })
    const { sendEmail } = await loadEmail()

    await sendEmail({ ...input, unsubscribeUrl: 'https://site.test/api/newsletter/unsubscribe?email=a&token=b' })
    expect(sendMail.mock.calls[0][0].headers).toEqual({
      'List-Unsubscribe': '<https://site.test/api/newsletter/unsubscribe?email=a&token=b>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    })
  })

  it('uses EMAIL_FROM_NAME as the display name', async () => {
    process.env.EMAIL_FROM_NAME = 'La tasse du mercredi'
    sendMail.mockResolvedValue({ messageId: '1' })
    const { sendEmail } = await loadEmail()

    await sendEmail(input)
    expect(sendMail.mock.calls[0][0].from).toEqual({ name: 'La tasse du mercredi', address: 'laure@gmail.com' })
  })

  it('reuses one transporter across sends', async () => {
    sendMail.mockResolvedValue({ messageId: '1' })
    const { sendEmail } = await loadEmail()

    await sendEmail(input)
    await sendEmail(input)
    expect(createTransport).toHaveBeenCalledTimes(1)
  })

  it('never throws on an SMTP error', async () => {
    sendMail.mockRejectedValue(new Error('Invalid login'))
    const { sendEmail } = await loadEmail()

    expect(await sendEmail(input)).toEqual({ ok: false, error: 'Invalid login' })
  })
})
