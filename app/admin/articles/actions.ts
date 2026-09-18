'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createArticle, updateArticle, deleteArticle } from '@/lib/articles'

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
  const coverImage = String(formData.get('coverImage') ?? '').trim()

  if (!title) return { error: 'Le titre est obligatoire.' as const }
  if (!category) return { error: 'La catégorie est obligatoire.' as const }
  if (!body) return { error: 'Le contenu est obligatoire.' as const }

  return { data: { title, category, body, coverImage: coverImage || undefined } }
}

export async function createArticleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const authorId = await requireAuthorId()
  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  await createArticle({ ...parsed.data, authorId })

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

  const parsed = read(formData)
  if (parsed.error) return { error: parsed.error }

  await updateArticle(id, parsed.data)

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath('/')
  redirect('/admin')
}

export async function deleteArticleAction(formData: FormData) {
  await requireAuthorId()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin')

  await deleteArticle(id)

  revalidatePath('/admin')
  revalidatePath('/articles')
  revalidatePath('/')
  redirect('/admin')
}
