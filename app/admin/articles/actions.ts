'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById,
} from '@/lib/articles'
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
  const category = String(formData.get('category') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()

  if (!title) return { error: 'Le titre est obligatoire.' as const }
  if (!category) return { error: 'La catégorie est obligatoire.' as const }
  if (!body) return { error: 'Le contenu est obligatoire.' as const }

  return { title, category, body }
}

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export async function createArticleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const authorId = await requireAuthorId()
  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  const cover = await resolveCoverField(formData, 'articles')
  if (cover.error) return { error: cover.error }

  try {
    await createArticle({ ...parsed, coverImage: cover.coverImage, authorId })
  } catch (error) {
    // A cover that just went up is now orphaned, so drop it before bailing.
    await removeCover(cover.coverImage)
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

  const cover = await resolveCoverField(formData, 'articles', current.coverImage)
  if (cover.error) return { error: cover.error }

  try {
    await updateArticle(id, { ...parsed, coverImage: cover.coverImage })
  } catch (error) {
    await removeCover(cover.coverImage)
    return { error: message(error, 'Enregistrement impossible.') }
  }

  // undefined means the cover was left alone, so the stored file stays put.
  if (cover.coverImage !== undefined) await removeCover(current.coverImage)

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath('/')
  redirect('/admin')
}

export async function deleteArticleAction(formData: FormData) {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin')

  const current = await getArticleById(id)
  await deleteArticle(id)
  await removeCover(current?.coverImage)

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath('/')
  redirect('/admin')
}
