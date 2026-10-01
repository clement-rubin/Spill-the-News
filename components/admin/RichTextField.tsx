'use client'

import { useRef } from 'react'

const FONTS = [
  { label: 'Police…', value: '' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
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
