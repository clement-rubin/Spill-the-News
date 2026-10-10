/**
 * An article can carry several cover photos, each with a caption. They live in
 * the existing `cover_image` text column so no migration is needed: a lone
 * photo without caption is stored as the bare URL, exactly as before (cards,
 * older articles and anything reading the column keep working), and anything
 * richer is stored as a JSON list.
 */
export interface Cover {
  url: string
  caption: string
}

export const MAX_COVERS = 12
export const MAX_CAPTION_LENGTH = 300

function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())
}

function clean(entry: unknown): Cover | null {
  if (!entry || typeof entry !== 'object') return null
  const { url, caption } = entry as { url?: unknown; caption?: unknown }
  if (!isHttpUrl(url)) return null
  return {
    url: url.trim(),
    caption: typeof caption === 'string' ? caption.replace(/\s+/g, ' ').trim().slice(0, MAX_CAPTION_LENGTH) : '',
  }
}

/** Reads the stored column value; anything unreadable yields no covers. */
export function parseCovers(raw: string | null | undefined): Cover[] {
  const value = raw?.trim()
  if (!value) return []

  if (value.startsWith('[')) {
    try {
      const list = JSON.parse(value)
      if (!Array.isArray(list)) return []
      return list.map(clean).filter((cover): cover is Cover => cover !== null)
    } catch {
      return []
    }
  }

  return [{ url: value, caption: '' }]
}

/** The column value for a list of covers, null when there are none. */
export function serializeCovers(covers: Cover[]): string | null {
  if (covers.length === 0) return null
  if (covers.length === 1 && !covers[0].caption) return covers[0].url
  return JSON.stringify(covers)
}

/**
 * Reads the editor's hidden field, returning a French error for bad input.
 * A form that does not carry the field at all (a stale page opened before this
 * existed) leaves `covers` undefined, meaning "do not touch the stored ones".
 */
export function readCoversField(raw: unknown): { covers?: Cover[] } | { error: string } {
  if (raw === null || raw === undefined) return {}

  let list: unknown
  try {
    list = JSON.parse(String(raw))
  } catch {
    return { error: 'Les photos de couverture sont illisibles. Recharge la page.' }
  }
  if (!Array.isArray(list)) return { error: 'Les photos de couverture sont illisibles. Recharge la page.' }
  if (list.length > MAX_COVERS) return { error: `Maximum ${MAX_COVERS} photos de couverture.` }

  const covers = list.map(clean)
  if (covers.some((cover) => cover === null)) {
    return { error: 'Une photo de couverture a une adresse invalide.' }
  }
  return { covers: covers as Cover[] }
}

/** Every URL in `before` that `after` no longer uses. */
export function droppedCoverUrls(before: Cover[], after: Cover[]): string[] {
  const kept = new Set(after.map((cover) => cover.url))
  return before.map((cover) => cover.url).filter((url) => !kept.has(url))
}
