import { marked } from 'marked'

/**
 * Writers mark section titles by bolding a whole line, and the toolbar's bold
 * button used to keep the trailing space of a double-click selection
 * (`**Titre **`), which marked then refuses to parse. Promoting such a line to
 * a real heading fixes both: the stray spaces go, and the title stands out
 * instead of sitting at body size.
 */
const BOLD_LINE = /^[ \t]*\*\*[ \t]*((?:[^*]|\*(?!\*))+?)[ \t]*\*\*[ \t]*$/

/** `![légende](url)` or `![légende](url "titre")`, alone on its line. */
const IMAGE_LINE = /^[ \t]*!\[(.*?)\]\((\S+?)(?:[ \t]+"[^"]*")?\)[ \t]*$/

const FENCE = /^[ \t]*(```|~~~)/

const MAX_TITLE_LENGTH = 200

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

interface Photo {
  caption: string
  url: string
}

function figure({ caption, url }: Photo): string {
  const alt = escapeAttribute(caption)
  const src = escapeAttribute(url)
  const legend = caption
    ? `<figcaption>${marked.parseInline(caption) as string}</figcaption>`
    : ''
  return `<figure><img src="${src}" alt="${alt}" loading="lazy" />${legend}</figure>`
}

/**
 * Photos on consecutive lines become one gallery so they sit side by side.
 * The block is emitted as raw HTML on a single line between blank lines,
 * which is how marked passes an HTML block through untouched.
 */
function gallery(photos: Photo[]): string {
  const className = photos.length > 1 ? 'photos photos--grid' : 'photos'
  return `\n<div class="${className}">${photos.map(figure).join('')}</div>\n`
}

export function prepareMarkdown(source: string): string {
  const out: string[] = []
  let photos: Photo[] = []
  let inFence = false

  const flush = () => {
    if (photos.length) out.push(gallery(photos))
    photos = []
  }

  for (const line of source.split(/\r?\n/)) {
    if (FENCE.test(line)) {
      flush()
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const image = line.match(IMAGE_LINE)
    if (image) {
      photos.push({ caption: image[1].trim(), url: image[2] })
      continue
    }
    // A blank line between two photos still keeps them in the same gallery.
    if (photos.length && !line.trim()) continue
    flush()

    const bold = line.match(BOLD_LINE)
    if (bold && bold[1].length <= MAX_TITLE_LENGTH) {
      out.push('', `## ${bold[1]}`, '')
      continue
    }

    out.push(line)
  }
  flush()

  return out.join('\n')
}

/** marked does not sanitize — safe only because bodies are admin-authored. */
export function renderMarkdown(source: string): string {
  return marked.parse(prepareMarkdown(source)) as string
}
