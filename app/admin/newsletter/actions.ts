'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createIssue, deleteIssue, dispatchIssue, type Recurrence } from '@/lib/newsletterIssues'

export interface FormState {
  error?: string
  success?: string
}

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/admin/login')
}

export async function sendNewsletterAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAuth()

  const subject = String(formData.get('subject') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '').trim()
  const recurrence = String(formData.get('recurrence') ?? 'none') as Recurrence

  if (!subject) return { error: 'Le sujet est obligatoire.' }
  if (!body) return { error: 'Le contenu est obligatoire.' }

  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null
  if (scheduledAtRaw && Number.isNaN(scheduledAt?.getTime())) {
    return { error: 'Date de programmation invalide.' }
  }

  try {
    if (scheduledAt && scheduledAt.getTime() > Date.now()) {
      await createIssue({ subject, body, status: 'scheduled', scheduledAt, recurrence })
      revalidatePath('/admin/newsletter')
      return { success: `Newsletter programmée pour le ${scheduledAt.toLocaleString('fr-FR')}.` }
    }

    await createIssue({ subject, body, status: 'sent', scheduledAt: null, recurrence })
    const { sent, failed } = await dispatchIssue(subject, body)
    revalidatePath('/admin/newsletter')
    return { success: `Newsletter envoyée à ${sent} abonné(s)${failed ? `, ${failed} échec(s)` : ''}.` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Envoi impossible.' }
  }
}

export async function deleteIssueAction(formData: FormData) {
  await requireAuth()
  const id = String(formData.get('id') ?? '')
  if (id) await deleteIssue(id)
  revalidatePath('/admin/newsletter')
}
