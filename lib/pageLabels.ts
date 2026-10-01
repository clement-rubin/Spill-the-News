import type { Article } from './articles'
import type { Episode } from './episodes'

const STATIC_PATH_LABELS: Record<string, string> = {
  '/': 'Accueil',
  '/articles': 'Articles',
  '/podcast': 'Podcast',
  '/signup': 'Inscription',
}

export function resolvePathLabel(path: string, articles: Article[], episodes: Episode[]): string {
  const staticLabel = STATIC_PATH_LABELS[path]
  if (staticLabel) return staticLabel

  const articleSlug = path.match(/^\/articles\/(.+)$/)?.[1]
  if (articleSlug) {
    const article = articles.find((a) => a.slug === articleSlug)
    if (article) return article.title
  }

  const episodeId = path.match(/^\/podcast\/(.+)$/)?.[1]
  if (episodeId) {
    const episode = episodes.find((e) => e.id === episodeId)
    if (episode) return episode.title
  }

  return path
}
