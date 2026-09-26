import { supabase } from './supabase'
import { slugify } from './slugify'

export const COVER_BUCKET = 'covers'

export const MAX_COVER_BYTES = 5 * 1024 * 1024

const ALLOWED_COVER_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export type CoverFolder = 'articles' | 'episodes'

/** Returns a French error message, or null when the file is acceptable. */
export function validateCover(file: { type: string; size: number }): string | null {
  if (!(file.type in ALLOWED_COVER_TYPES)) {
    return 'Format d’image non supporté. Utilise JPG, PNG, WebP, GIF ou AVIF.'
  }
  if (file.size === 0) return 'Le fichier image est vide.'
  if (file.size > MAX_COVER_BYTES) {
    return `Image trop lourde (max ${Math.round(MAX_COVER_BYTES / 1024 / 1024)} Mo).`
  }
  return null
}

/**
 * The original name is kept only so the file stays recognisable in the Supabase
 * dashboard; the random suffix is what stops two uploads of `cover.png` from
 * overwriting each other.
 */
export function coverStorageName(
  folder: CoverFolder,
  originalName: string,
  mimeType: string
): string {
  const extension = ALLOWED_COVER_TYPES[mimeType] ?? 'bin'
  const base = slugify(originalName.replace(/\.[^.]+$/, '')).slice(0, 40)
  const unique = crypto.randomUUID().slice(0, 8)
  return `${folder}/${Date.now()}-${unique}${base ? `-${base}` : ''}.${extension}`
}

function publicBase(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`
}

/** The object path inside a public URL, or null when the URL is not ours. */
export function managedCoverPath(url: string | null | undefined): string | null {
  const prefix = `${publicBase()}/${COVER_BUCKET}/`
  if (!url || !url.startsWith(prefix)) return null
  return decodeURIComponent(url.slice(prefix.length))
}

async function ensureBucket(): Promise<void> {
  const { error } = await supabase.storage.createBucket(COVER_BUCKET, {
    public: true,
    fileSizeLimit: MAX_COVER_BYTES,
  })
  // Already-exists is the normal path after the very first upload. Any other
  // failure means the service role cannot reach Storage, so say so plainly
  // instead of letting the upload fail with something cryptic.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(
      `Bucket « ${COVER_BUCKET} » indisponible : ${error.message}. Crée-le dans Supabase > Storage.`
    )
  }
}

export async function uploadCover(file: File, folder: CoverFolder): Promise<string> {
  const invalid = validateCover(file)
  if (invalid) throw new Error(invalid)

  await ensureBucket()

  const path = coverStorageName(folder, file.name, file.type)
  const { error } = await supabase.storage
    .from(COVER_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })

  if (error) throw new Error(`Envoi de l’image impossible : ${error.message}`)

  return supabase.storage.from(COVER_BUCKET).getPublicUrl(path).data.publicUrl
}

/** No-op for outside URLs, so pasted links are never touched. */
export async function removeCover(url: string | null | undefined): Promise<void> {
  const path = managedCoverPath(url)
  if (!path) return
  await supabase.storage.from(COVER_BUCKET).remove([path])
}

export interface CoverField {
  /** undefined = leave the column alone, null = clear it, string = set it. */
  coverImage?: string | null
  error?: string
}

/**
 * A picked file always wins over the URL box, since picking one is the newer
 * intent. An emptied URL box means "no cover", which is how a cover gets
 * removed without a second form.
 */
export async function resolveCoverField(
  formData: FormData,
  folder: CoverFolder,
  previous: string | null = null
): Promise<CoverField> {
  const file = formData.get('coverFile')
  if (file instanceof File && file.size > 0) {
    try {
      return { coverImage: await uploadCover(file, folder) }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Envoi de l’image impossible.',
      }
    }
  }

  const url = String(formData.get('coverImage') ?? '').trim()
  if (url === previous) return {}
  return { coverImage: url || null }
}
