'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById,
} from '@/lib/articles'
import { removeCovers, removeDroppedImages, uploadCover } from '@/lib/storage'
import { droppedCoverUrls, readCoversField } from '@/lib/covers'
import { authorExists } from '@/lib/users'

export interface FormState {
  error?: string
}

async function requireAuthorId() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')
  return user.id
}

function read(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!title) return { error: 'Le titre est obligatoire.' as const }
  if (!category) return { error: 'La catégorie est obligatoire.' as const }
  if (!body) return { error: 'Le contenu est obligatoire.' as const }

  return { title, category, body }
}

/** The picked author, the fallback when the field is absent, or null if unknown. */
async function readAuthor(formData: FormData, fallback: string): Promise<string | null> {
  const picked = String(formData.get('authorId') ?? '').trim()
  if (!picked) return fallback
  return (await authorExists(picked)) ? picked : null
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function createArticleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const currentUserId = await requireAuthorId()
  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  const authorId = await readAuthor(formData, currentUserId)
  if (!authorId) return { error: 'Auteur introuvable.' }

  const cover = readCoversField(formData.get('covers'))
  if ('error' in cover) return { error: cover.error }

  // The photos were uploaded when picked, so a failed save keeps them: the
  // editor is still open on the same list and can simply try again.
  try {
    await createArticle({ ...parsed, covers: cover.covers, authorId })
  } catch (error) {
    return { error: message(error, 'Publication impossible.') }
  }

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath('/')
  redirect('/admin')
}

export async function updateArticleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Article introuvable.' }

  const current = await getArticleById(id)
  if (!current) return { error: 'Article introuvable.' }

  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  const authorId = await readAuthor(formData, current.authorId)
  if (!authorId) return { error: 'Auteur introuvable.' }

  const cover = readCoversField(formData.get('covers'))
  if ('error' in cover) return { error: cover.error }

  try {
    await updateArticle(id, { ...parsed, covers: cover.covers, authorId })
  } catch (error) {
    return { error: message(error, 'Enregistrement impossible.') }
  }

  if (cover.covers) await removeCovers(droppedCoverUrls(current.covers, cover.covers))
  await removeDroppedImages(current.body, parsed.body)

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath(`/articles/${current.slug}`)
  revalidatePath('/')
  redirect('/admin')
}

export async function deleteArticleAction(formData: FormData) {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin')

  const current = await getArticleById(id)
  await deleteArticle(id)
  if (current) await removeCovers(current.covers.map((cover) => cover.url))
  if (current) await removeDroppedImages(current.body)

  revalidatePath('/admin')
  revalidatePath('/articles')
  if (current) revalidatePath(`/articles/${current.slug}`)
  revalidatePath('/')
  redirect('/admin')
}

export interface PhotoUpload {
  url?: string
  error?: string
}

/** Called by the editor for body photos and cover photos: uploads one file, returns its URL. */
export async function uploadArticlePhotoAction(formData: FormData): Promise<PhotoUpload> {
  await requireAuthorId()
  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) return { error: 'Aucune photo reçue.' }

  try {
    return { url: await uploadCover(file, 'articles') }
  } catch (error) {
    return { error: message(error, 'Envoi de la photo impossible.') }
  }
}
