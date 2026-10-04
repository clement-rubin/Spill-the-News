const CONTENT_PATH = /^\/(articles|podcast)\/([^/]+)$/

/** Only an article or an episode page counts as a view. */
export function parseContentPath(path: string): { kind: 'article' | 'episode'; key: string } | null {
  const match = path.match(CONTENT_PATH)
  if (!match) return null
  let key = match[2]
  try {
    key = decodeURIComponent(key)
  } catch {
    // A malformed escape is kept as-is; it simply won't match any content.
  }
  return { kind: match[1] === 'articles' ? 'article' : 'episode', key }
}

export function isContentPath(path: string): boolean {
  return parseContentPath(path) !== null
}
