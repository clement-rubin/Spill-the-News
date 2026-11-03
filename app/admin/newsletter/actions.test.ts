import { vi, describe, it, expect, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  createIssue: vi.fn(),
  deleteIssue: vi.fn(),
  dispatchIssue: vi.fn(),
  sendTestIssue: vi.fn(),
}))

vi.mock('@/lib/session', () => ({ getCurrentUser: mocks.getCurrentUser }))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/lib/newsletterIssues', () => ({
  createIssue: mocks.createIssue,
  deleteIssue: mocks.deleteIssue,
  dispatchIssue: mocks.dispatchIssue,
  sendTestIssue: mocks.sendTestIssue,
}))

import { sendNewsletterAction } from './actions'

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

const issue = { subject: 'Numéro 1', body: 'Bonjour **tout le monde**' }

describe('sendNewsletterAction — test send', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getCurrentUser.mockResolvedValue({ id: 'admin-1' })
  })

  it('sends only to the test address and saves nothing', async () => {
    mocks.sendTestIssue.mockResolvedValue({ ok: true })

    const state = await sendNewsletterAction({}, form({ ...issue, intent: 'test', testEmail: ' Me@Gmail.com ' }))

    expect(mocks.sendTestIssue).toHaveBeenCalledWith('me@gmail.com', issue.subject, issue.body)
    expect(mocks.dispatchIssue).not.toHaveBeenCalled()
    expect(mocks.createIssue).not.toHaveBeenCalled()
    expect(state.success).toContain('me@gmail.com')
  })

  it('rejects a missing or invalid test address', async () => {
    const state = await sendNewsletterAction({}, form({ ...issue, intent: 'test', testEmail: 'nope' }))

    expect(state.error).toBe('Adresse de test invalide.')
    expect(mocks.sendTestIssue).not.toHaveBeenCalled()
  })

  it('reports a failed test send', async () => {
    mocks.sendTestIssue.mockResolvedValue({ ok: false, error: 'Invalid login' })

    const state = await sendNewsletterAction({}, form({ ...issue, intent: 'test', testEmail: 'me@gmail.com' }))

    expect(state.error).toContain('Invalid login')
  })

  it('still sends to every subscriber without the test intent', async () => {
    mocks.createIssue.mockResolvedValue({})
    mocks.dispatchIssue.mockResolvedValue({ sent: 3, failed: 0 })

    const state = await sendNewsletterAction({}, form({ ...issue, intent: 'send', testEmail: 'me@gmail.com' }))

    expect(mocks.sendTestIssue).not.toHaveBeenCalled()
    expect(mocks.dispatchIssue).toHaveBeenCalledWith(issue.subject, issue.body)
    expect(state.success).toContain('3 abonné(s)')
  })
})
