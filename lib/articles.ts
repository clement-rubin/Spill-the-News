import { supabase } from './supabase'
import { slugify } from './slugify'

export interface CreateArticleInput {
  title: string
  body: string
  category: string
  coverImage?: string
  authorId: string
}

export interface UpdateArticleInput {
  title?: string
  body?: string
  category?: string
  coverImage?: string
}

interface AuthorRow {
  id: string
  name: string
  email: string
}

interface ArticleRow {
  id: string
  title: string
  slug: string
  cover_image: string | null
  body: string
  category: string
  published_at: string
  author_id: string
  author: AuthorRow | null
}

export interface Article {
  id: string
  title: string
  slug: string
  coverImage: string | null
  body: string
  category: string
  publishedAt: Date
  authorId: string
  author: AuthorRow
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    coverImage: row.cover_image,
    body: row.body,
    category: row.category,
    publishedAt: new Date(row.published_at),
    authorId: row.author_id,
    author: row.author ?? { id: '', name: 'Inconnu', email: '' },
  }
}

export function generateUniqueSlug(base: string, taken: Set<string>): string {
  let slug = base
  let suffix = 1
  while (taken.has(slug)) slug = `${base}-${++suffix}`
  return slug
}

export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const base = slugify(input.title)

  const { data: existing } = await supabase
    .from('articles')
    .select('slug')
    .like('slug', `${base}%`)

  const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug))
  const slug = generateUniqueSlug(base, taken)

  const { data, error } = await supabase
    .from('articles')
    .insert({
      title: input.title,
      body: input.body,
      category: input.category,
      cover_image: input.coverImage ?? null,
      author_id: input.authorId,
      slug,
    })
    .select('*, author:users(id, name, email)')
    .single()

  if (error) throw error
  return mapArticle(data as ArticleRow)
}

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(id, name, email)')
    .order('published_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapArticle(r as ArticleRow))
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(id, name, email)')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) return null
  return mapArticle(data as ArticleRow)
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*, author:users(id, name, email)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapArticle(data as ArticleRow)
}

export async function updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.body !== undefined) patch.body = input.body
  if (input.category !== undefined) patch.category = input.category
  if (input.coverImage !== undefined) patch.cover_image = input.coverImage

  const { data, error } = await supabase
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select('*, author:users(id, name, email)')
    .single()

  if (error) throw error
  return mapArticle(data as ArticleRow)
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}
