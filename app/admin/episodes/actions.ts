'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createEpisode, updateEpisode, deleteEpisode, getEpisodeById } from '@/lib/episodes'
import { resolveCoverField, removeCover } from '@/lib/storage'

export interface FormState {
  error?: string
}

async function requireAuthorId() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/admin/login')
  return session.user.id
}

function read(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const externalLink = String(formData.get('externalLink') ?? '').trim()

  if (!title) return { error: 'Le titre est obligatoire.' as const }
  if (!description) return { error: 'La description est obligatoire.' as const }
  if (!externalLink) return { error: 'Le lien d’écoute est obligatoire.' as const }

  // Anything rendered into href has to be a real http(s) URL — a bare string
  // would let javascript: through.
  try {
    const url = new URL(externalLink)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { error: 'Le lien doit commencer par http:// ou https://' as const }
    }
  } catch {
    return { error: 'Le lien n’est pas une URL valide.' as const }
  }

  return { title, description, externalLink }
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function createEpisodeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const authorId = await requireAuthorId()
  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  const cover = await resolveCoverField(formData, 'episodes')
  if (cover.error) return { error: cover.error }

  try {
    await createEpisode({ ...parsed, coverImage: cover.coverImage, authorId })
  } catch (error) {
    await removeCover(cover.coverImage)
    return { error: message(error, 'Publication impossible.') }
  }

  revalidatePath('/admin')
  revalidatePath('/podcast')
  revalidatePath('/')
  redirect('/admin')
}

export async function updateEpisodeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Épisode introuvable.' }

  const current = await getEpisodeById(id)
  if (!current) return { error: 'Épisode introuvable.' }

  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  const cover = await resolveCoverField(formData, 'episodes', current.coverImage)
  if (cover.error) return { error: cover.error }

  try {
    await updateEpisode(id, { ...parsed, coverImage: cover.coverImage })
  } catch (error) {
    await removeCover(cover.coverImage)
    return { error: message(error, 'Enregistrement impossible.') }
  }

  // undefined means the cover was left alone, so the stored file stays put.
  if (cover.coverImage !== undefined) await removeCover(current.coverImage)

  revalidatePath('/admin')
  revalidatePath('/podcast')
  revalidatePath('/')
  redirect('/admin')
}

export async function deleteEpisodeAction(formData: FormData) {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin')

  const current = await getEpisodeById(id)
  await deleteEpisode(id)
  await removeCover(current?.coverImage)

  revalidatePath('/admin')
  revalidatePath('/podcast')
  revalidatePath('/')
  redirect('/admin')
}
