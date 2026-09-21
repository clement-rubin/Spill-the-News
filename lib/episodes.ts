import { supabase } from './supabase'

export interface CreateEpisodeInput {
  title: string
  description: string
  externalLink: string
  coverImage?: string
  authorId: string
}

export interface UpdateEpisodeInput {
  title?: string
  description?: string
  externalLink?: string
  coverImage?: string
}

interface AuthorRow {
  id: string
  name: string
  email: string
}

interface EpisodeRow {
  id: string
  title: string
  description: string
  external_link: string
  cover_image: string | null
  published_at: string
  author_id: string
  author: AuthorRow | null
}

export interface Episode {
  id: string
  title: string
  description: string
  externalLink: string
  coverImage: string | null
  publishedAt: Date
  authorId: string
  author: AuthorRow
}

function mapEpisode(row: EpisodeRow): Episode {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    externalLink: row.external_link,
    coverImage: row.cover_image,
    publishedAt: new Date(row.published_at),
    authorId: row.author_id,
    author: row.author ?? { id: '', name: 'Inconnu', email: '' },
  }
}

export async function createEpisode(input: CreateEpisodeInput): Promise<Episode> {
  const { data, error } = await supabase
    .from('episodes')
    .insert({
      title: input.title,
      description: input.description,
      external_link: input.externalLink,
      cover_image: input.coverImage ?? null,
      author_id: input.authorId,
    })
    .select('*, author:users(id, name, email)')
    .single()

  if (error) throw error
  return mapEpisode(data as EpisodeRow)
}

export async function getEpisodes(): Promise<Episode[]> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*, author:users(id, name, email)')
    .order('published_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => mapEpisode(r as EpisodeRow))
}

export async function getEpisodeById(id: string): Promise<Episode | null> {
  const { data, error } = await supabase
    .from('episodes')
    .select('*, author:users(id, name, email)')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return mapEpisode(data as EpisodeRow)
}

export async function updateEpisode(id: string, input: UpdateEpisodeInput): Promise<Episode> {
  const patch: Record<string, unknown> = {}
  if (input.title !== undefined) patch.title = input.title
  if (input.description !== undefined) patch.description = input.description
  if (input.externalLink !== undefined) patch.external_link = input.externalLink
  if (input.coverImage !== undefined) patch.cover_image = input.coverImage

  const { data, error } = await supabase
    .from('episodes')
    .update(patch)
    .eq('id', id)
    .select('*, author:users(id, name, email)')
    .single()

  if (error) throw error
  return mapEpisode(data as EpisodeRow)
}

export async function deleteEpisode(id: string): Promise<void> {
  const { error } = await supabase.from('episodes').delete().eq('id', id)
  if (error) throw error
}
