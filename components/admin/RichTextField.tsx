'use client'

import { useRef } from 'react'

const FONTS = [
  { label: 'Police…', value: '' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
]

const ALIGNMENTS = [
  { value: 'left', title: 'Aligner à gauche' },
  { value: 'center', title: 'Centrer' },
  { value: 'right', title: 'Aligner à droite' },
  { value: 'justify', title: 'Justifier' },
]

interface Props {
  id: string
  name: string
  defaultValue?: string
}

export default function RichTextField({ id, name, defaultValue }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = ref.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = el.value.slice(start, end) || placeholder

    el.value = el.value.slice(0, start) + before + selected + after + el.value.slice(end)
    el.focus()
    const cursor = start + before.length + selected.length + after.length
    el.setSelectionRange(cursor, cursor)
  }

  function insertLink() {
    const url = window.prompt('Adresse du lien (https://…) :')
    if (!url) return
    wrapSelection('[', `](${url})`, 'texte du lien')
  }

  // Blank lines around the content let marked keep parsing the Markdown inside the div.
  function align(value: string) {
    const el = ref.current
    if (!el) return

    // Trim the blank lines a quote leaves behind so they don't pile up.
    const selected = el.value.slice(el.selectionStart, el.selectionEnd).trim()
    el.setRangeText(selected, el.selectionStart, el.selectionEnd, 'select')
    wrapSelection(`\n\n<div style="text-align: ${value}">\n\n`, '\n\n</div>\n\n', 'texte aligné')
  }

  function quote() {
    const el = ref.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = el.value.slice(start, end) || 'citation'
    const quoted = selected
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')

    el.value = el.value.slice(0, start) + '\n\n' + quoted + '\n\n' + el.value.slice(end)
    el.focus()
    const cursor = start + quoted.length + 4
    el.setSelectionRange(cursor, cursor)
  }

  function applyFont(fontFamily: string) {
    if (!fontFamily) return
    wrapSelection(`<span style="font-family: ${fontFamily}">`, '</span>', 'texte')
  }

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Mise en forme du texte">
        <button type="button" className="rte-btn" title="Gras" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('**', '**', 'texte en gras')}>
          <strong>G</strong>
        </button>
        <button type="button" className="rte-btn" title="Italique" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('*', '*', 'texte en italique')}>
          <em>I</em>
        </button>
        <button type="button" className="rte-btn" title="Souligné" onMouseDown={(e) => e.preventDefault()} onClick={() => wrapSelection('<u>', '</u>', 'texte souligné')}>
          <span style={{ textDecoration: 'underline' }}>S</span>
        </button>
        <button type="button" className="rte-btn" title="Lien" onMouseDown={(e) => e.preventDefault()} onClick={insertLink}>
          🔗
        </button>
        <button type="button" className="rte-btn" title="Citation" onMouseDown={(e) => e.preventDefault()} onClick={quote}>
          ❝
        </button>
        {ALIGNMENTS.map((a) => (
          <button key={a.value} type="button" className="rte-btn" title={a.title} aria-label={a.title} onMouseDown={(e) => e.preventDefault()} onClick={() => align(a.value)}>
            <AlignIcon value={a.value} />
          </button>
        ))}
        <select
          className="rte-font"
          aria-label="Police d'écriture"
          defaultValue=""
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            applyFont(e.target.value)
            e.target.value = ''
          }}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <textarea ref={ref} id={id} name={name} className="textarea" defaultValue={defaultValue} required />
    </div>
  )
}

/** Four lines whose lengths and offsets mimic each alignment. */
function AlignIcon({ value }: { value: string }) {
  const widths = value === 'justify' ? [14, 14, 14, 14] : [14, 9, 12, 8]
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      {widths.map((w, i) => {
        const x = value === 'center' ? (16 - w) / 2 : value === 'right' ? 15 - w : 1
        return <rect key={i} x={x} y={1 + i * 3.5} width={w} height="1.6" rx="0.8" fill="currentColor" />
      })}
    </svg>
  )
}
