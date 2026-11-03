/**
 * Formatting applied by the article editor's toolbar, kept out of the
 * component so it can be tested without a browser. Each function takes the
 * textarea's text and selection and returns the new text with the selection
 * to restore, so pressing the same button twice puts things back.
 */

export type Emphasis = 'bold' | 'italic'

export interface TextEdit {
  value: string
  selectionStart: number
  selectionEnd: number
}

/** How many asterisks each emphasis takes: `**gras**`, `*italique*`. */
const WEIGHT: Record<Emphasis, number> = { bold: 2, italic: 1 }

/** List bullets, numbers, quote marks and heading hashes stay outside the markers. */
const LINE_PREFIX = /^[ \t]*(?:[-*+][ \t]+|\d+[.)][ \t]+|>[ \t]?|#{1,6}[ \t]+)/

/** A line holding only an HTML tag, like the ones alignment adds. */
const HTML_LINE = /^[ \t]*<\/?[a-z][^>]*>[ \t]*$/i

const BLANK_LINES = /(\n[ \t]*\n\s*)/

function countStars(text: string, fromEnd = false): number {
  return (fromEnd ? text.match(/\*+$/) : text.match(/^\*+/))?.[0].length ?? 0
}

/** Asterisk runs of 2 or 3 carry bold, runs of 1 or 3 carry italics. */
function isActive(run: number, kind: Emphasis): boolean {
  return kind === 'bold' ? run >= 2 : run % 2 === 1
}

function unwrap(text: string, weight: number): string {
  return text.slice(weight, text.length - weight)
}

function wrap(text: string, weight: number): string {
  const marks = '*'.repeat(weight)
  return marks + text + marks
}

/**
 * Bolds or italicises the selection, or removes it when it is already there.
 * Spaces picked up by a double-click stay outside the markers, since marked
 * does not read `**mot **` as bold. A selection spanning several paragraphs
 * or list items gets markers on each, because emphasis cannot cross them.
 */
export function toggleEmphasis(
  value: string,
  start: number,
  end: number,
  kind: Emphasis,
  placeholder: string
): TextEdit {
  const weight = WEIGHT[kind]
  const raw = value.slice(start, end)
  const lead = raw.match(/^\s*/)?.[0].length ?? 0
  const trail = raw.slice(lead).match(/\s*$/)?.[0].length ?? 0
  const from = start + lead
  const to = end - trail
  const selected = value.slice(from, to)

  if (!selected) {
    const inserted = wrap(placeholder, weight)
    return {
      value: value.slice(0, end) + inserted + value.slice(end),
      selectionStart: end + weight,
      selectionEnd: end + weight + placeholder.length,
    }
  }

  if (!selected.includes('\n') && !LINE_PREFIX.test(selected)) {
    return toggleInline(value, from, to, kind)
  }

  const pieces = splitUnits(selected)
  const units = pieces.filter((piece): piece is { unit: string } => typeof piece !== 'string')
  const allActive = units.every(({ unit }) =>
    isActive(Math.min(countStars(unit), countStars(unit, true)), kind)
  )
  const replaced = pieces
    .map((piece) => {
      if (typeof piece === 'string') return piece
      const run = Math.min(countStars(piece.unit), countStars(piece.unit, true))
      if (allActive) return unwrap(piece.unit, weight)
      return isActive(run, kind) ? piece.unit : wrap(piece.unit, weight)
    })
    .join('')

  return {
    value: value.slice(0, from) + replaced + value.slice(to),
    selectionStart: from,
    selectionEnd: from + replaced.length,
  }
}

/** One stretch of text inside a line: a word, a sentence, a whole line. */
function toggleInline(value: string, from: number, to: number, kind: Emphasis): TextEdit {
  const weight = WEIGHT[kind]
  const selected = value.slice(from, to)

  // A double-click on a bold word selects the word without its asterisks,
  // so the markers just outside the selection count too, when both sides have them.
  const before = countStars(value.slice(0, from), true)
  const after = countStars(value.slice(to))
  const outside = Math.min(before, after) > 0
  const left = countStars(selected) + (outside ? before : 0)
  const right = countStars(selected, true) + (outside ? after : 0)

  if (isActive(Math.min(left, right), kind)) {
    const regionStart = from - (outside ? before : 0)
    const regionEnd = to + (outside ? after : 0)
    const core = selected.slice(countStars(selected), selected.length - countStars(selected, true))
    const replaced = '*'.repeat(left - weight) + core + '*'.repeat(right - weight)
    const coreStart = regionStart + left - weight
    return {
      value: value.slice(0, regionStart) + replaced + value.slice(regionEnd),
      selectionStart: coreStart,
      selectionEnd: coreStart + core.length,
    }
  }

  return {
    value: value.slice(0, from) + wrap(selected, weight) + value.slice(to),
    selectionStart: from + weight,
    selectionEnd: to + weight,
  }
}

type Piece = string | { unit: string }

/**
 * Cuts a multi-line selection into the parts that each get their own markers:
 * whole paragraphs, or single lines in lists and quotes. Blank lines, prefixes
 * and HTML tag lines are kept as they are.
 */
function splitUnits(text: string): Piece[] {
  const pieces: Piece[] = []
  text.split(BLANK_LINES).forEach((block, index) => {
    if (index % 2 === 1 || !block.trim()) {
      pieces.push(block)
      return
    }
    const lines = block.split('\n')
    const byLine = lines.some((line) => LINE_PREFIX.test(line) || HTML_LINE.test(line))
    if (!byLine) {
      pieces.push(...trimmed(block))
      return
    }
    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) pieces.push('\n')
      if (HTML_LINE.test(line) || !line.trim()) {
        pieces.push(line)
        return
      }
      const prefix = line.match(LINE_PREFIX)?.[0] ?? ''
      pieces.push(prefix, ...trimmed(line.slice(prefix.length)))
    })
  })
  return pieces
}

function trimmed(text: string): Piece[] {
  const lead = text.match(/^\s*/)?.[0] ?? ''
  const trail = text.slice(lead.length).match(/\s*$/)?.[0] ?? ''
  const unit = text.slice(lead.length, text.length - trail.length)
  return unit ? [lead, { unit }, trail] : [text]
}

const ALIGNED_BLOCK = /^<div style="text-align: \w+">\s*([\s\S]*?)\s*<\/div>$/
const OPENING_BEFORE = /<div style="text-align: \w+">\s*$/
const CLOSING_AFTER = /^\s*<\/div>/

/**
 * Puts the selection in a block aligned left, centred, right or justified.
 * Choosing again on text that is already aligned changes its alignment
 * instead of nesting a second block; left, the default, just removes it.
 * Blank lines around the content let marked keep parsing the Markdown inside.
 */
export function alignBlock(
  value: string,
  start: number,
  end: number,
  alignment: string,
  placeholder: string
): TextEdit {
  let from = start
  let to = end
  let content = value.slice(start, end).trim()

  const own = content.match(ALIGNED_BLOCK)
  const opening = value.slice(0, start).match(OPENING_BEFORE)
  const closing = value.slice(end).match(CLOSING_AFTER)
  if (own) {
    content = own[1]
  } else if (content && opening && closing) {
    from = start - opening[0].length
    to = end + closing[0].length
  }
  content ||= placeholder

  // Line breaks already around the selection are dropped so they don't pile up.
  const head = value.slice(0, from).replace(/\n+$/, '')
  const tail = value.slice(to).replace(/^\n+/, '')

  const removing = alignment === 'left' && (own || (opening && closing))
  const gapBefore = head ? '\n\n' : ''
  const gapAfter = tail ? '\n\n' : ''
  const before = removing ? gapBefore : `${gapBefore}<div style="text-align: ${alignment}">\n\n`
  const after = removing ? gapAfter : `\n\n</div>${gapAfter}`

  const contentStart = head.length + before.length
  return {
    value: head + before + content + after + tail,
    selectionStart: contentStart,
    selectionEnd: contentStart + content.length,
  }
}
